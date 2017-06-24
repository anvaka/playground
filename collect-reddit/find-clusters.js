// Let's say you have an ngraph instance:
const createGraph = require('ngraph.graph');
const graph = createGraph({uniqueLinkId: false});
const downloadedFile = process.argv[3] || 'abouts.json';
const forEachSub = require('./lib/forEachSub.js');
const extractRelated = require('./lib/extract-related.js');
const detectClusters = require('ngraph.louvain');
const coarsen = require('ngraph.coarsen');
const fs = require('fs');
const tojson = require('ngraph.tojson');
const path = require('path');
const outFolder = path.join('data', 'clusters');
const mkdirp = require('mkdirp');

mkdirp.sync(outFolder);

// // To detect clusters:
//
forEachSub(downloadedFile, (sub) => {
  const subName = sub.display_name.toLowerCase();
  const subInfo = extractRelated(sub);

  graph.addNode(subName, sub.subscribers);

  if (subInfo.related.length > 0) {
    subInfo.related.forEach(x => {
      graph.addLink(subName, x);
    });
  }
}, saveClusters);

function saveClusters() {
  const clusters = detectClusters(graph);

  const clusterGraph = coarsen(graph, clusters);
  clusterGraph.forEachNode(coarseNode => {
    const nodeGraph = createGraph({uniqueLinkId: false});

    coarseNode.data.forEach(nodeId => {
      nodeGraph.addNode(nodeId, graph.getNode(nodeId).data);

      graph.forEachLinkedNode(nodeId, otherNode => {
        if (coarseNode.data.has(otherNode.id)) {
          nodeGraph.addLink(nodeId, otherNode.id)
        }
      }, true);
    });

    fs.writeFileSync(path.join(outFolder, coarseNode.id + '.json'), tojson(nodeGraph));
  })
}
