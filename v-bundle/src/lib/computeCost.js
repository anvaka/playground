module.exports = computeCost;

function computeCost(graph, linkRenderer) {
  let unbundledDistance = 0;

  graph.forEachLink(l => {
    let from = graph.getNode(l.fromId).data;
    let to = graph.getNode(l.toId).data;

    unbundledDistance += getLength(from, to);
  });

  let routedLength = 0;
  linkRenderer.forEachEdge(edge => {
    routedLength += getLength(edge.from, edge.to);
  })

  return {
    unbundledDistance,
    routedLength
  };
}

function getLength(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}