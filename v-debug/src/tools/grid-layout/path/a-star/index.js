// We will try to minimize f(n) = g(n) + h(n), where
// g(n) is actual distance from source node to `n`, and
// h(n) is heuristic distance from `n` to target node.

module.exports = aStarPathSearch;

// heuristics.
aStarPathSearch.l1 = l1;
aStarPathSearch.l2 = l2;

/**
 * Euclid distance (l2 norm);
 * 
 * @param {*} a 
 * @param {*} b 
 */
function l2(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan distance (l1 norm);
 * @param {*} a 
 * @param {*} b 
 */
function l1(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.abs(dx) + Math.abs(dy);
}

const NodeHeap = require('../NodeHeap');

class NodeSearchState {
  constructor(node) {
    this.node = node;

    // How we came to this node?
    this.parent = null;

    this.closed = false;
    this.open = 0;

    this.distanceToSource = Number.POSITIVE_INFINITY;
    // the f(n) = g(n) + h(n) value
    this.fScore = Number.POSITIVE_INFINITY;

    // used to reconstruct heap when fScore is updated.
    this.heapIndex = -1;
  }
}

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
    let to = graph.getNode(toId);

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

function reconstructPath(searchState) {
  let path = [searchState.node];
  let parent = searchState.parent;

  while (parent) {
    path.push(parent.node);
    parent = parent.parent;
  }

  return path;
}

function goalReached(searchState, targetNode) {
  return searchState.node === targetNode;
}

function compareFScore(a, b) {
  return a.fScore - b.fScore;
}

function setHeapIndex(nodeSearchState, heapIndex) {
  nodeSearchState.heapIndex = heapIndex;
}

function bidirectionalAStar(graph, options) {
  throw new Error('Not implemented');
}