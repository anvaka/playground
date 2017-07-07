module.exports = getAvgDegree;

function getAvgDegree(graph) {
  let totalLinksCount = 0;

  graph.forEachNode(function(node) {
    if (node.links) {
      totalLinksCount += node.links.length
    }
  });
  if (totalLinksCount === 0) return 0;

  return graph.getNodesCount() / totalLinksCount
}
