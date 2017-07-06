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
        if (p.distance < minLength) {
          minLength = p.distance
          minPath = p
        }
      })
    })

    let p = minPath
    let points = []
    while (p) {
      points.push(p.id)
      p = p.prev
    }

    return points
  }

  function findPath (from, to) {
    let searchState = searchStateMemory.get(from)
    if (!searchState) {
      let q = []
      let i = new Map() 

      graph.forEachNode(n => {
        let queueItem = {
          id: n.id,
          distance: n.id === from ? 0 : Number.POSITIVE_INFINITY,
          prev: undefined
        }
        i.set(n.id, queueItem)
        q.push(queueItem)
      })

      searchState = {
        info: i,
        queue: q
      }

      searchStateMemory.set(from, searchState)
    }

    let info = searchState.info
    let queue = searchState.queue
    let lastResult = info.get(to)

    if (lastResult && lastResult.prev) return lastResult

    let needSort = true
    while (queue.length) {
      if (needSort) {
        queue.sort(desc)
        needSort = false
      }

      let n = queue.pop()

      visitNode(n)

      if (n.id === to) {
        return n
      }
    }

    function visitNode (node) {
      let srcInfo = info.get(node.id)

      graph.forEachLinkedNode(node.id, otherNode => {
        let distance = srcInfo.distance + length(graph.getNode(node.id), otherNode)
        let otherInfo = info.get(otherNode.id)
        if (distance < otherInfo.distance) {
          otherInfo.distance = distance
          otherInfo.prev = node
          needSort = true
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

function desc (a, b) {
  return b.distance - a.distance
}
