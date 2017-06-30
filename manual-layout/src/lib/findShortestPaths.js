module.exports = findShortestPaths

function findShortestPaths (graph, from, to) {
  let minLength = Number.POSITIVE_INFINITY
  let minPath

  from.forEach(src => {
    to.forEach(dst => {
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

  function findPath (from, to) {
    let pathLength
    let info = new Map()
    let queue = []

    graph.forEachNode(n => {
      let queueItem = {
        id: n.id,
        distance: n.id === from ? 0 : Number.POSITIVE_INFINITY,
        prev: undefined
      }
      info.set(n.id, queueItem)
      queue.push(queueItem)
    })

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

  function length (a, b) {
    let aPos = a.data.pos
    let bPos = b.data.pos
    let dx = aPos[0] - bPos[0]
    let dy = aPos[1] - bPos[1]

    return dx * dx + dy * dy
  }
}

function desc (a, b) {
  return b.distance - a.distance
}
