var FibonacciHeap = require('@tyriar/fibonacci-heap');

module.exports = shortestPaths

function shortestPaths (graph) {
  let searchStateMemory = new Map()

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
      p = p.prevPath
    }

    return points
  }

  function findPath (from, to) {
    let searchState = searchStateMemory.get(from)
    if (!searchState) {
      let fh = new FibonacciHeap()
      let i = new Map()

      graph.forEachNode(n => {
        let distance = n.id === from ? 0 : Number.POSITIVE_INFINITY
        // let queueItem = {
        //   id: n.id,
        //   prev: undefined
        // }
        // q.push(queueItem)
        let node = fh.insert(distance, n.id)
        node.prevPath = undefined

        i.set(n.id, node)
      })

      searchState = {
        info: i,
        heap: fh
      }

      searchStateMemory.set(from, searchState)
    }

    let info = searchState.info
    let heap = searchState.heap
    let lastResult = info.get(to)

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
      let srcInfo = info.get(nodeId)

      graph.forEachLinkedNode(nodeId, otherNode => {
        let distance = srcInfo.key + length(graph.getNode(nodeId), otherNode)
        let otherInfo = info.get(otherNode.id)
        if (distance < otherInfo.key) {
          // otherInfo.distance = distance
          otherInfo.prevPath = srcInfo
          heap.decreaseKey(otherInfo, distance);

          // needSort = true
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
