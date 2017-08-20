var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');


module.exports = initDetecClusters;

function initDetecClusters(bus) {
  bus.on('detect-clusters', detectClusters);

  function detectClusters(srcGraph) {
    var clusters = louvain(srcGraph);
    var clusterGraph = coarsen(srcGraph, clusters);
    console.log(clusterGraph);

    bus.fire('clusters-ready', clusterGraph);
  }
}
