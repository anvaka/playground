const createLayout = require('ngraph.forcelayout')
const getBounds = require('./lib/getBounds.js')

module.exports = getInitialLayout

function getInitialLayout (graph) {
  graph.forEachNode(node => {
    if (typeof node.data !== 'number') {
      node.data = node.links.length
    }
  })
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
    const x = node.data
    const side = (5 + x) // 2 * Math.log(x) * Math.log(x))
    // const side = (5 + x * 2)
    const next = side // roundGrid(side, 5)

    rects.push({
      cx: roundGrid(pos.x, 5),
      cy: roundGrid(pos.y, 5),
      width: next,
      height: next,
      id: node.id,
      fontSize: 4
    })
  })

  rects.bounds = getBounds(rects)

  return rects
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}
