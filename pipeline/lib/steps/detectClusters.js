var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');
var createGraph = require('ngraph.graph');

module.exports = detectClusters;

function detectClusters(ctx) {
  let graph = ctx.graph;
  var clusters = louvain(graph);

  var coarseGraph = coarsen(graph, clusters);
  let clusterGraphs = [];

  coarseGraph.forEachNode(n => {
    var dstGraph = createGraph({
      uniqueLinkId: false
    });
    clusterGraphs.push(dstGraph);

    n.data.forEach(srcNodeId => {
      dstGraph.addNode(srcNodeId);
    });
    n.data.forEach(srcNodeId => {
      graph.forEachLinkedNode(srcNodeId, otherNode => {
        if (n.data.has(otherNode.id)) {
          dstGraph.addLink(srcNodeId, otherNode.id)
        }
      }, true);
    });
  })

  ctx.clusterGraphs = clusterGraphs;
  ctx.coarseGraph = coarseGraph;

  return ctx;
}
