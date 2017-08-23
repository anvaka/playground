var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');


module.exports = initDetecClusters;

function initDetecClusters(bus) {
  bus.on('detect-clusters', detectClusters);

  function detectClusters(e) {
    var srcGraph = e.graph;
    var requestId = e.requestId;
    var clusters = louvain(srcGraph);
    var clusterGraph = coarsen(srcGraph, clusters);

    var clusterResults = {
      srcGraph: srcGraph,
      clusterGraph: clusterGraph,
      requestId: requestId,
      getAllSrcNodesInCluster: e.getAllSrcNodesInCluster
    };
    Object.freeze(clusterResults);
    bus.fire('clusters-ready', clusterResults);
  }
}
