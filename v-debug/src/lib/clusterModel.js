var GraphLayer = require('./cluster/GraphLayer');

function init(rootGraph) {
  var root = new GraphLayer(rootGraph);

  var api = {
    root,
    getClusterPath,
    rootGraph,
    selectedCluster: root
  };

  Object.freeze(rootGraph);
  root.freeze();
  return api;

  function getClusterPath(pointId) {
    let path = [];
    let clusterWithNode = this.root.findPoint(pointId);
    while(clusterWithNode) {
      path.push(clusterWithNode);
      clusterWithNode = clusterWithNode.parent;
    }

    return path;
  }
}

module.exports = init;