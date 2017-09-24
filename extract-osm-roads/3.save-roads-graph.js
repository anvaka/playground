var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs')

var createProjector = require('./lib/createProjector.js');
var graph = require('ngraph.graph')();
var nodes = new Map();
var BBox = require('./bbox.js');
var lonLatBbox = new BBox();
var latLonToNodeId = new Map();
 
var outFileName = process.argv[3];

var parser = JSONStream.parse('elements.*');

fs.createReadStream(process.argv[2])
  .pipe(parser)
  .pipe(es.mapSync(callback))
  .on('end', done);

function callback(el) {
  if (el.type === 'node') processOSMNode(el);
  else if (el.type === 'way') processOSMWay(el)
}

function done() {
  saveResults();
}

function processOSMWay(way) {
  var nodes = way.nodes;
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

function processOSMError() {
  console.log('error');
}

function processOSMNode(node) {
  lonLatBbox.addPoint(node.lon, node.lat);

  nodes.set(node.id, {
    lon: node.lon,
    lat: node.lat
  });
}

function id(x, y) { return x + ';' + y; }


function saveResults() {
  console.log('Graph loaded. Processing...');
  var xyBBox = new BBox();
  let project = createProjector(lonLatBbox);

  var nodesToDelete = new Set();
  graph.forEachNode(node => {
    let data = nodes.get(node.id);

    if (!data) throw new Error('missing data for ' + node.id);

    var nodeData = project(data.lon, data.lat);

    let xyID = id(nodeData.x, nodeData.y);
    let prevNode = latLonToNodeId.get(xyID)
    if (prevNode) {
      xyID = id(nodeData.x, nodeData.y);
      prevNode = latLonToNodeId.get(xyID);
      console.log('!Marking for deletion', node.id);
      nodesToDelete.add(node.id);
    } else {
      latLonToNodeId.set(xyID, node);
    }

    node.data = nodeData;
    xyBBox.addPoint(node.data.x, node.data.y);
  });

  nodesToDelete.forEach(nodeId => {
    console.log('removing', nodeId);
    graph.removeNode(nodeId);
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
