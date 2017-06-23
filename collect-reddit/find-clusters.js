// Let's say you have an ngraph instance:
const graph = require('ngraph.graph')({uniqueLinkId: false});
const downloadedFile = process.argv[3] || 'abouts.json';
const forEachSub = require('./lib/forEachSub.js');
const extractRelated = require('./lib/extract-related.js');
const detectClusters = require('ngraph.louvain');
const coarsen = require('ngraph.coarsen');
const save_json = require('ngraph.tojson');
const fs = require('fs');

// // To detect clusters:
//
forEachSub(downloadedFile, (sub) => {
  const subName = sub.display_name.toLowerCase();
  const subInfo = extractRelated(sub);
  if (subInfo.related.length > 0) {
    subInfo.related.forEach(x => {
      graph.addLink(subName, x);
    });
  }
}, () => {
  const clusters = detectClusters(graph);
  const clusterGraph = coarsen(graph, clusters);
  fs.writeFileSync('cluster-graph.json', save_json(clusterGraph));
});

function findLargestCluster() {
  const clusters = detectClusters(graph);
  const counts = new Map();

  // now you can iterate over each node and get it's community (aka class):
  let largestClusterCount = -1;
  let largeCluster;

  graph.forEachNode(function(node) {
    const nodeClass = clusters.getClass(node.id);
    const count = (counts.get(nodeClass) || 0) + 1;
    if (count > largestClusterCount) {
      largestClusterCount = count;
      largeCluster = nodeClass
    }
    counts.set(nodeClass, count)
  });

  const largeClusterSet = new Set();
  graph.forEachNode(function(node) {
    const nodeClass = clusters.getClass(node.id);
    if (nodeClass === largeCluster) {
      largeClusterSet.add(node.id);
    }
  });

  console.log('digraph G {');

  largeClusterSet.forEach((nodeId) => {
    graph.forEachLinkedNode(nodeId, otherNode => {
      if (largeClusterSet.has(otherNode.id)) {
        console.log(nodeId + ' -> ' + otherNode.id);
      }
    }, true);
  });
  console.log('}');
}
