module.exports = getAirlinesLayout;

function getAirlinesLayout(graph) {
  const positions = []
  const edges = []
  const idToPos = new Map();

  graph.forEachNode(node => {
    const side = 5
    const next = side
    const pos = {
      cx: roundGrid(node.data.x, 5) - next / 2,
      cy: roundGrid(node.data.y, 5) - next / 2,
      id: node.id,
    }
    idToPos.set(node.id, pos);
    positions.push(pos)
  })

  graph.forEachLink(link => {
    edges.push({
      from: idToPos.get(link.fromId),
      to: idToPos.get(link.toId),
    })
  })

  return {
    positions: positions,
    edges: edges,
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
