var fs = require('fs');
var inputFile = process.argv[2] || './data/SpatialMaps_dataset.json';

if (!fs.existsSync(inputFile)) {
  console.log('You need to provide a spatial maps file');
  console.log('E.g.: ')
  console.log('    node ./data/SpatialMaps_dataset.json');
  process.exit(1);
}

// We are going to build connections based on these distance attributes
var distanceFeatures = ["n113", "n114", "n115", "n116", "n117", "n118", "n119", "n121"];
// The maximum allowed distance between two records is this:
var maxEdgeDistance = 0.04;
// Records that are farther than this value do not form an edge.
// the value if 0.04 is picked based on dataset observation: 50% of the nearest neighbors
// had distance shorter than 0.03477297801454457 (p50). The p90 is 0.05912334564281694,
// and p99 is 0.09283619983605532

// If you want to save graph to a dot format, set the non-empty string here:
var saveDotFile = 'graph.dot';
// Make this to true, if you want to produce layout, compatible with
// 
var saveLayout = true;

var graph = require('ngraph.graph')();
var records = require(inputFile);
console.log('Read ' + records.length + ' records');
console.log('Storing them as graph...');
records.forEach(record => {
  var id = record.id;
  if (graph.hasNode(id)) {
    throw new Error('Duplicate record: ' + id);
  }
  graph.addNode(id);
});

console.log('Finding nearest neighbors for each node');
var allNearest = [];

records.forEach(srcRecord => {
  var neighbors = [];
  records.forEach(otherRecord => {
    if (otherRecord.id === srcRecord.id) return;
    neighbors.push({
       id: otherRecord.id,
       distance: distance(srcRecord, otherRecord)
    })
  });
  // sort so that nearest are at the top
  neighbors.sort((a, b) => a.distance - b.distance);
  for (var i = 0; i < neighbors.length; ++i) {
    var potentialLink = neighbors[i];
    if (potentialLink.distance > maxEdgeDistance) break;
    // Passes threshold, let's make a link.
    graph.addLink(srcRecord.id, potentialLink.id)
  }
  allNearest.push(neighbors[0].distance)
});


// un-comment this to get statistics.
// allNearest.sort((a, b) => a - b);
// console.log(allNearest);
// console.log('p50', allNearest[Math.round(allNearest.length * 0.5)])
// console.log('p90', allNearest[Math.round(allNearest.length * 0.9)])
// console.log('p99', allNearest[Math.round(allNearest.length * 0.99)])

console.log('Graph created', graph.getNodesCount() + ' nodes; ' + graph.getLinksCount() + ' edges.');

if (saveDotFile) {
  var dotContent = require('ngraph.todot')(graph);
  fs.writeFileSync(saveDotFile, dotContent, 'utf8');
  console.log('.dot file saved to ' + saveDotFile);
}

if (saveLayout) {
  var createLayout = require('ngraph.offline.layout');
  var toBinary = require('ngraph.tobinary');
  var outDir = './layout';
  console.log('Saving layout to ' + outDir);
  var layout = createLayout(graph, {
    iterations: 300, 
    saveEach: 300, 
    outDir: outDir, 
  });
  layout.run();

  toBinary(graph, {
    outDir: outDir
  });
}

function distance(a, b) {
  var sum = 0;

  distanceFeatures.forEach(featureName => {
    if (!(featureName in a)) {
      throw new Error(featureName + ' is missing in ' + a.id);
    }
    if (!(featureName in b)) {
      throw new Error(featureName + ' is missing in ' + b.id);
    }

    var df = (a[featureName] - b[featureName]);
    sum += df * df; 
  });

  return Math.sqrt(sum);
}