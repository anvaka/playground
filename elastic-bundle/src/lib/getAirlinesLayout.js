module.exports = getAirlinesLayout;

function getAirlinesLayout(graph) {
  const positions = []
  const edges = []
  const idToPos = new Map();

  graph.forEachNode(node => {
    const side = 5
    const next = side
    const pos = {
      x: roundGrid(node.data.x, 5) - next / 2,
      y: roundGrid(node.data.y, 5) - next / 2,
      id: node.id,
      r: 1.5
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

  const api = {
    positions: positions,
    edges: edges,
    tighten,
    layout: { getNodePosition }
  }

  return api

  function getNodePosition(nodeId) {
    return graph.getNode(nodeId).data
  }

  function tighten(nodeId) {
    let toLinks = []
    let from = getNodePosition(nodeId);
    graph.forEachLinkedNode(nodeId, (other) => {
      toLinks.push({
        id: other.id,
        pos: getNodePosition(other.id)
      })
    });

    let angles = []

    for (let i = 0; i < toLinks.length; ++i) {
      let secondAngle = getAngle(from, toLinks[i].pos)
      angles.push(normalizeAngle({
        angle: secondAngle,
        nodeId: toLinks[i].id
      }))
    }
    angles.sort((x, y) => {
      return x.angle - y.angle
    })

    console.log(angles);
  }

  function normalizeAngle(angle) {
    if (angle < 0) {
      return 360 + angle
    }
    return angle
  }

  function getAngle(from, to) {
    let dy = to.y - from.y;
    let dx = to.x - from.x
    return normalizeAngle(Math.atan2(dy, dx) / Math.PI * 180)
  }
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}
