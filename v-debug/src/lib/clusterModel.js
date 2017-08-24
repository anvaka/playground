var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');

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
  return clusterResults;
}

function init(rootGraph) {
  var levels = [];

  var api = {
    detectNextClusterLevel
  };

  Object.freeze(api);

  return api;

  function detectNextClusterLevel() {
      let levelsCount = levels.length
      let graph = levelsCount ? levels[levelsCount - 1].clusterGraph : rootGraph;

      let clusterResults = detectClusters({
        graph,
        getAllSrcNodesInCluster,
        requestId: levelsCount,
      });
      levels.push(clusterResults);

      return clusterResults;

      function getAllSrcNodesInCluster(clusterData) {
        if (levelsCount === 0) {
          return Array.from(clusterData);
        } else {
          let allNodes = [];
          let prevLayer = levels[levelsCount - 1];

          clusterData.forEach(nodeId => {
            let prevData = prevLayer.clusterGraph.getNode(nodeId).data;
            let nodes = prevLayer.getAllSrcNodesInCluster(prevData);
            allNodes = allNodes.concat(nodes);
          })
          return allNodes;
        }
      }
    }
}

module.exports = init;