module.exports = getScore

function getScore (graph, positions) {
  let distance = 0

  graph.forEachNode(node => {
    let src = getCenter(node)
    graph.forEachLinkedNode(node.id, (otherNode) => {
      let dest = getCenter(otherNode)
      distance += getDistance(src, dest)
    })
  })

  return {
    distance
  }

  function getCenter (node) {
    let r = positions.get(node.id)

    return {
      x: r.cx,
      y: r.cy
    }
  }

  function getDistance (a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
  }
}
