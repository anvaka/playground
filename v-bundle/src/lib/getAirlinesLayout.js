module.exports = getAirlinesLayout;

function getAirlinesLayout(graph) {
  let idToPos = new Map();

  const api = {
    positions: [],
    edges: [],
    getNodePosition,
  }

  updateApiPositions()

  return api

  function updateApiPositions() {
    let positions = []
    let edges = []
    idToPos = new Map();

    graph.forEachNode(node => {
      const pos = {
        x: node.data.x,
        y: node.data.y,
        id: node.id,
        r: node.data.r || 1
      }
      idToPos.set(node.id, pos);
      positions.push(pos)
    })

    graph.forEachLink(link => {
      let weight = (link.data && link.data.weight) || 1
      edges.push({
        weight: weight,
        from: idToPos.get(link.fromId),
        to: idToPos.get(link.toId),
      })
    })

    api.positions = positions;
    api.edges = edges;
  }

  function getNodePosition(nodeId) {
    return graph.getNode(nodeId).data
  }
}
