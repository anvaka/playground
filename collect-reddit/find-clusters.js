// Let's say you have an ngraph instance:
const createGraph = require('ngraph.graph');
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

// const graph = createGraph({uniqueLinkId: false});

mkdirp.sync(outFolder);

// // To detect clusters:
//
// forEachSub(downloadedFile, (sub) => {
//   const subName = sub.display_name.toLowerCase();
//   const subInfo = extractRelated(sub);
//
//   graph.addNode(subName, sub.subscribers);
//
//   if (subInfo.related.length > 0) {
//     subInfo.related.forEach(x => {
//       graph.addLink(subName, x);
//     });
//   }
// }, saveClusters);

const graph = require('miserables');
saveClusters();

function saveClusters() {
  let prevGraph = graph;
  let clusters = detectClusters(graph);
  let lastGraph = coarsen(graph, clusters);
  let layer = 0;
  while(clusters.canCoarse()) {
    saveLayer(layer++);
    prevGraph = lastGraph;
    lastGraph = coarsen(prevGraph, clusters);
    clusters = detectClusters(lastGraph);
  }

  function saveLayer(layerNumber) {
    lastGraph.forEachNode(coarseNode => {
      const nodeGraph = createGraph({uniqueLinkId: false});

      coarseNode.data.forEach(nodeId => {
        let data = prevGraph.getNode(nodeId).data
        let nodes = (data instanceof Set) ? Array.from(data) : data
        nodeGraph.addNode(nodeId, { nodes: nodes });

        graph.forEachLinkedNode(nodeId, otherNode => {
          if (coarseNode.data.has(otherNode.id)) {
            nodeGraph.addLink(nodeId, otherNode.id)
          }
        }, true);
      });

      fs.writeFileSync(path.join(outFolder, layerNumber + '_' + coarseNode.id + '.json'), tojson(nodeGraph));
    })
  }
}
