var FibonacciHeap = require('@tyriar/fibonacci-heap');

module.exports = shortestPaths

function shortestPaths (graph) {
  // maps from node id to shortest path algorithm state.
  let searchStateMemory = new Map()

  // remembers how many times each edge appeared in a shortest path
  let edgeMemory = new Map();
  let maxEdgeWeight = 1;

  return findShortestPaths

  function findShortestPaths(from, to) {
    let minLength = Number.POSITIVE_INFINITY
    let minPath

    from.forEach(src => {
      to.forEach(dst => {
        if (src === dst) return

        let p = findPath(src, dst)
        if (p.key < minLength) {
          minLength = p.distance
          minPath = p
        }
      })
    })

    let p = minPath
    let points = []
    while (p) {
      points.push(p.value)
      let from = p
      p = p.prevPath
      let to = p
      rememberEdge(from, to);
    }

    return points
  }

  function rememberEdge(a, b) {
    if (!a || !b) return;

    let from = a.value;
    let to = b.value;
    let edgeId = getEdgeId(from, to);
    let edgeWeight = getEdgeWeight(edgeId) + 1
    if (edgeWeight > maxEdgeWeight) maxEdgeWeight = edgeWeight
    edgeMemory.set(edgeId, edgeWeight)
  }

  function getEdgeWeight(edgeId) {
    return edgeMemory.get(edgeId) || 0
  }

  function getEdgeId(from, to) {
    if (from > to) {
      // edges are undirected
      let t = from;
      from = to;
      to = t;
    }

    return from + to
  }

  function findPath (from, to) {
    let searchState = searchStateMemory.get(from)
    if (!searchState) {
      let heap = new FibonacciHeap()
      // TODO: Is there a way to get fibonacci node without extra map?
      let nodeIdToHeapNode = new Map()

      graph.forEachNode(n => {
        let distance = n.id === from ? 0 : Number.POSITIVE_INFINITY
        let node = heap.insert(distance, n.id)
        node.prevPath = undefined

        nodeIdToHeapNode.set(n.id, node)
      })

      searchState = {
        nodeIdToHeapNode: nodeIdToHeapNode,
        heap: heap
      }

      searchStateMemory.set(from, searchState)
    }

    let nodeIdToHeapNode = searchState.nodeIdToHeapNode
    let heap = searchState.heap
    let lastResult = nodeIdToHeapNode.get(to)

    if (lastResult && lastResult.prevPath) return lastResult

    while (heap.size() > 0) {
      let minNode = heap.extractMinimum()

      visitNode(minNode)

      if (minNode.value === to) {
        return lastResult
      }
    }

    function visitNode (node) {
      let nodeId = node.value; // node.id
      let srcInfo = nodeIdToHeapNode.get(nodeId)

      graph.forEachLinkedNode(nodeId, otherNode => {
        let seenNumberOfTimes = getEdgeWeight(getEdgeId(nodeId, otherNode.id))
        // let weightReducer = 1 - 0.5 * (seenNumberOfTimes/maxEdgeWeight)

        let weightReducer = 1 / ( seenNumberOfTimes || 1)

        let distance = srcInfo.key + length(graph.getNode(nodeId), otherNode) * weightReducer
        let otherInfo = nodeIdToHeapNode.get(otherNode.id)
        if (distance < otherInfo.key) {
          otherInfo.prevPath = srcInfo
          heap.decreaseKey(otherInfo, distance);
        }
      })
    }
  }
}

function length (a, b) {
  let aPos = a.data.pos
  let bPos = b.data.pos
  let dx = aPos[0] - bPos[0]
  let dy = aPos[1] - bPos[1]

  return dx * dx + dy * dy
}
