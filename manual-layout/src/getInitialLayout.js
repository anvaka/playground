const createLayout = require('ngraph.forcelayout')
const getBounds = require('./lib/getBounds.js')
const Rect = require('./lib/rect.js')

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

    rects.push(new Rect({
      top: roundGrid(pos.y, 5) - next / 2,
      left: roundGrid(pos.x, 5) - next / 2,
      width: next,
      height: next,
      id: node.id,
      fontSize: 4
    }))
  })

  rects.bounds = getBounds(rects)

  return {
    positions: rects,
    layout: layout
  }
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}
