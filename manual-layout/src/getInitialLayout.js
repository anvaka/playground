import createLayout from 'ngraph.forcelayout'
// import removeOverlaps from 'remove-overlaps'

export default function getInitialLayout (graph) {
  const layout = createLayout(graph, {
    nodeMass (nodeId) {
      return graph.getNode(nodeId).data
    }
  })
  for (let i = 0; i < 1000; ++i) {
    layout.step()
  }

  const rects = []
  graph.forEachNode(node => {
    const pos = layout.getNodePosition(node.id)
    const x = node.data // || node.links.length
    const side = (5 + x) // 2 * Math.log(x) * Math.log(x))
    // const side = (5 + x * 2)
    const next = side // roundGrid(side, 5)

    rects.push({
      x: roundGrid(pos.x, 5),
      y: roundGrid(pos.y, 5),
      width: next,
      height: next,
      id: node.id
    })
  })

  // removeOverlaps(rects, {
  //   method: 'rectangle'
  // })

  return rects
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}
