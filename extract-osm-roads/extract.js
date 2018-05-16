var fs = require('fs');
var inFileName = process.argv[2];
var outFileName = process.argv[3]

var osmread = require('osm-read');

var graph = require('ngraph.graph')();
var nodes = new Map();
var BBox = require('./bbox.js');
var bbox = new BBox();

osmread.parse({
  filePath: inFileName,
  endDocument: saveResults,
  node: processOSMNode,
  way: processOSMWay,
  error: processOSMError
});

function processOSMWay(way) {
  if (way.tags && way.tags.highway) {
    var nodes = way.nodeRefs;
    if (!nodes) {
      console.log('no nodes', way)
      return;
    }
    for (var i = 1; i < nodes.length; ++i) {
      let from = nodes[i];
      let to = nodes[i - 1];
      graph.addLink(from, to);
    }
  }
}

function processOSMError() {
  console.log('error');
}

function processOSMNode(node) {
  bbox.addPoint(node.lon, node.lat);

  nodes.set(node.id, {
    lon: node.lon,
    lat: node.lat
  });

}

function saveResults() {
  console.log('end');
  var phi0 = Math.cos(bbox.cy);
  var r = 6371393; // radius of earth in meters
  var xyBBox = new BBox();
  graph.forEachNode(node => {
    let data = nodes.get(node.id);

    if (!data) throw new Error('missing data for ' + node.id);

    node.data = {
      x: -Math.round(r * data.lon * phi0),
      y: -Math.round(r * data.lat),
    };
    xyBBox.addPoint(node.data.x, node.data.y);
  });

  moveCoordinatesToZero();
  writeGraph(outFileName, graph);
  console.log(xyBBox);


  function moveCoordinatesToZero() {
    let dx = xyBBox.cx
    let dy = xyBBox.cy;
    let movedBbox = new BBox();

    graph.forEachNode(node => {
      node.data.x = Math.round(node.data.x - dx);
      node.data.y = Math.round(node.data.y - dy);
      movedBbox.addPoint(node.data.x, node.data.y);
    });


    console.log('moved bbox', movedBbox);
  }
}

function writeGraph(fileName, graph) {
  let nodeIdMap = new Map();
  saveNodes(fileName + '.co.bin', graph, nodeIdMap);
  saveLinks(fileName + '.gr.bin', graph, nodeIdMap);
}

function saveNodes(fileName, graph, nodeIdMap) {
  var nodeCount = graph.getNodesCount();
  var buf = new Buffer(nodeCount * 4 * 2);
  var idx = 0;
  graph.forEachNode(p => {
    nodeIdMap.set(p.id, 1 + idx / 8);

    buf.writeInt32LE(p.data.x, idx);
    idx += 4;
    buf.writeInt32LE(p.data.y, idx);
    idx += 4;
  });

  fs.writeFileSync(fileName , buf);
  console.log('Nodes saved to ', fileName);
}

function saveLinks(fileName, graph, nodeIdMap) {
  var buf = new Buffer(graph.getLinksCount() * 4 * 2);
  var idx = 0;
  graph.forEachLink(l => {
    let fromId = nodeIdMap.get(l.fromId);
    let toId = nodeIdMap.get(l.toId);
    if (!fromId || !toId) throw new Error('missing id')

    buf.writeInt32LE(fromId, idx);
    idx += 4;
    buf.writeInt32LE(toId, idx);
    idx += 4;
  })

  fs.writeFileSync(fileName, buf);
  console.log('links saved to ', fileName);
}
