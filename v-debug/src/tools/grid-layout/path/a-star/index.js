// We will try to minimize f(n) = g(n) + h(n), where
// g(n) is actual distance from source node to `n`, and
// h(n) is heuristic distance from `n` to target node.

module.exports = aStarPathSearch;

const reconstructPath = require('./reconstructPath');
const NodeHeap = require('../NodeHeap');
const NodeSearchState = require('./NodeSearchState');
const heuristics = require('./heuristics');

Object.assign(module.exports, heuristics);

function aStarPathSearch(graph, options) {
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
    // Maps nodeId to NodeSearchState.
    let nodeState = new Map();

    // the nodes that we still need to evaluate
    let openSet = new NodeHeap({
      compare: compareFScore,
      setNodeId: setHeapIndex
    });

    let from = graph.getNode(fromId);
    if (!from) throw new Error('fromId is not defined in this graph: ' + fromId);
    let to = graph.getNode(toId);
    if (!to) throw new Error('toId is not defined in this graph: ' + toId);

    let startNode = new NodeSearchState(from);
    nodeState.set(fromId, startNode);

    // For the first node, fScore is completely heuristic.
    startNode.fScore = heuristic(from, to);

    // The cost of going from start to start is zero.
    startNode.distanceToSource = 0;
    openSet.push(startNode);
    startNode.open = 1;

    while (openSet.length > 0) {
      let current = openSet.pop();
      if (goalReached(current, to)) return reconstructPath(current);

      // no need to visit this node anymore
      current.closed = true;
      graph.forEachLinkedNode(
        current.node.id,
        (otherNode, link) => visitNode(otherNode, link, current),
        oriented
      );
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
      if (otherSearchState.open === 0) {
        // Remember this node.
        openSet.push(otherSearchState);
        otherSearchState.open = 1;
      }

      let tentativeDistance = cameFrom.distanceToSource + distance(otherSearchState.node, cameFrom.node, link);
      if (tentativeDistance >= otherSearchState.distanceToSource) {
        // This would only make our path longer. Ignore this route.
        return;
      }

      // bingo! we found shorter path:
      otherSearchState.parent = cameFrom;
      otherSearchState.distanceToSource = tentativeDistance;
      otherSearchState.fScore = tentativeDistance + heuristic(otherSearchState.node, to);

      openSet.updateItem(otherSearchState.heapIndex);
    }

    return []; // No path.
  }
}

function goalReached(searchState, targetNode) {
  return searchState.node === targetNode;
}

function compareFScore(a, b) {
  let result = a.fScore - b.fScore;
  // TODO: Can I improve speed with smarter ties-breaking?
  // I tried distanceToSource, but it didn't seem to have much effect
  return result;
}

function setHeapIndex(nodeSearchState, heapIndex) {
  nodeSearchState.heapIndex = heapIndex;
}