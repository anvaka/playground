module.exports = bidirectionalAStar;

const NodeHeap = require('../NodeHeap');
const NodeSearchState = require('./NodeSearchState');
const heuristics = require('./heuristics');

const BY_FROM = 1;
const BY_TO = 2;

Object.assign(module.exports, heuristics);
function bidirectionalAStar(graph, options) {
  options = options || {};
  // whether traversal should be considered over oriented graph.
  let oriented = options.oriented;

  let heuristic = options.heuristic;
  if (!heuristic) throw new Error('Heuristic is required');

  let distance = options.distance;
  if (!distance) throw new Error('Distance function is required');

  return {
    find: find
  };

  function find(fromId, toId) {
    let from = graph.getNode(fromId);
    let to = graph.getNode(toId);

    if (from === to) return [from]; // trivial case.

    // Maps nodeId to NodeSearchState.
    let nodeState = new Map();

    let openSetFrom = new NodeHeap({
      compare: compareFScore,
      setNodeId: setHeapIndex
    });

    let openSetTo = new NodeHeap({
      compare: compareFScore,
      setNodeId: setHeapIndex
    });


    let startNode = new NodeSearchState(from);
    nodeState.set(fromId, startNode);

    // For the first node, fScore is completely heuristic.
    startNode.fScore = heuristic(from, to);
    // The cost of going from start to start is zero.
    startNode.distanceToSource = 0;
    openSetFrom.push(startNode);
    startNode.open = BY_FROM;

    let endNode = new NodeSearchState(to);
    endNode.fScore = heuristic(to, from);
    endNode.distanceToSource = 0;
    openSetTo.push(endNode);
    endNode.open = BY_TO;

    // Cost of the best solution found so far. Used for accurate termination
    let lMin = Number.POSITIVE_INFINITY;
    let minFrom;
    let minTo;

    let currentSet = openSetFrom;
    let currentOpener = BY_FROM;

    while (openSetFrom.length > 0 && openSetTo.length > 0) {
      if (openSetFrom.length < openSetTo.length) {
        // we pick a set with less elements
        currentOpener = BY_FROM;
        currentSet = openSetFrom;
      } else {
        currentOpener = BY_TO;
        currentSet = openSetTo;
      }

      let current = currentSet.pop();

      // no need to visit this node anymore
      current.closed = true;

      if (current.distanceToSource > lMin) continue;

      graph.forEachLinkedNode(
        current.node.id,
        (otherNode, link) => visitNode(otherNode, link, current),
        oriented
      );
    }

    function canExit(currentNode) {
      let opener = currentNode.open
      if (opener && opener !== currentOpener) {
        return true;
      }

      return false;
    }

    function reconstructBiDirectionalPath(a, b) {
      let pathOfNodes = [];
      let aParent = a;
      while(aParent) {
        pathOfNodes.push(aParent.node);
        aParent = aParent.parent;
      }
      let bParent = b;
      while (bParent) {
        pathOfNodes.unshift(bParent.node);
        bParent = bParent.parent
      }
      return pathOfNodes;
    }

    function visitNode(otherNode, link, cameFrom) {
      let otherSearchState = nodeState.get(otherNode.id);
      if (!otherSearchState) {
        otherSearchState = new NodeSearchState(otherNode);
        nodeState.set(otherNode.id, otherSearchState);
      }

      if (otherSearchState.closed) {
        // Already processed this node.
        return;
      }

      if (canExit(otherSearchState, cameFrom)) {
        // this node was opened by alternative opener. The sets intersect now, but
        // we found an optimal path, that goes through *this* node. However, there
        // is no guarantee that this is the global optimal solution path.

        let potentialLMin = otherSearchState.distanceToSource + cameFrom.distanceToSource;
        if (potentialLMin < lMin) {
          minFrom = otherSearchState;
          minTo = cameFrom
          lMin = potentialLMin;
        }
        // foundPath = reconstructBiDirectionalPath(otherSearchState, cameFrom);
        // we are done with this node.
        return;
      }


      let tentativeDistance = cameFrom.distanceToSource + distance(otherSearchState.node, cameFrom.node, link);

      if (tentativeDistance >= otherSearchState.distanceToSource) {
        // This would only make our path longer. Ignore this route.
        return;
      }

      // Choose target based on current working set:
      let target = (currentOpener === BY_FROM) ? to : from;
      let newFScore = tentativeDistance + heuristic(otherSearchState.node, target);
      if (newFScore >= lMin) {
        return;
      }
      otherSearchState.fScore = newFScore;

      if (otherSearchState.open === 0) {
        // Remember this node in the current set
        currentSet.push(otherSearchState);
        currentSet.updateItem(otherSearchState.heapIndex);

        otherSearchState.open = currentOpener;
      }

      // bingo! we found shorter path:
      otherSearchState.parent = cameFrom;
      otherSearchState.distanceToSource = tentativeDistance;
    }

    if (minFrom && minTo) {
      return reconstructBiDirectionalPath(minFrom, minTo);
    }
    return []; // No path.
  }
}

function compareFScore(a, b) {
  return a.fScore - b.fScore;
}

function setHeapIndex(nodeSearchState, heapIndex) {
  nodeSearchState.heapIndex = heapIndex;
}