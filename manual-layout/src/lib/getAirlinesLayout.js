const getBounds = require('./getBounds.js')
const Rect = require('./rect.js')

module.exports = getAirlinesLayout;

function getAirlinesLayout(graph) {
  const rects = []
  graph.forEachNode(node => {
    const pos = node.data
    const side = 5
    const next = side

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
    layout: {
      getNodePosition(nodeId) {
        return graph.getNode(nodeId).data
      }
    }
  }
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}
