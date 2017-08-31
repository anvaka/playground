module.exports = buildNodeMassFunction;

function buildNodeMassFunction(cluster) {
  if (cluster.level > 0) {
    // if cluster is not at the bottom most level, then each node
    // is a cluster. To determine its mass we need to know how many
    // other nodes are in there.
    return function clusterMass(nodeId) {
      let child = cluster.childrenLookup.get(nodeId);
      return child.getMass();
    }
  }
  let graph = cluster.graph;
  return function nodeMass(nodeId) {
    let node = graph.getNode(nodeId);
    let factor = 1;
    if (node.data && node.data.size) {
      factor = 1;// node.data.size;
    }
    if (node.links) return (node.links.length + 1) * factor;
    return 1;
  }
}