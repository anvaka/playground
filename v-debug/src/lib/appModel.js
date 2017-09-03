var GraphLayer = require('./cluster/GraphLayer');
var pagerank = require('ngraph.pagerank')
var Rect = require('./overlaps/rect')
var removeOverlaps = require('./overlaps/removeOverlaps');

const toolsToInit = require('../tools/index.js');

function init(rootGraph, autoCluster = false) {
  peprocessGraphNodeSize(rootGraph);
  var root = new GraphLayer(rootGraph);

  if (autoCluster) {
    var newRoot;

    do {
      // todo: i need to ignore isolated clusters, and add them at the end.
      newRoot = root.split();
      if (newRoot) root = newRoot;
    } while (newRoot)
  }


  var tools = [];
  var api = {
    root,
    getClusterPath,
    rootGraph,
    selectedCluster: root,
    tidyUp,
    tools: tools
  };

  toolsToInit.forEach(createTool => {
    tools.push(createTool(api));
  });

  Object.freeze(rootGraph);
  root.freeze();
  return api;

  function tidyUp() {
    let root = this.root;
    // root.forEachLeaf(cluster => {
    //   processCity(cluster);
    // });
    root.forEachNode(cluster => {
      if (!cluster.children) return;

      for (let i = 0; i < 5; ++i) {
        cluster.removeOverlaps({
          pullX: true
        });
      }
    });
  }

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

function processCity(cluster) {
  if (cluster.children) {
    // only bottom level clusters are considered cities
    throw new Error('cluster is not a city');
  }
  for (var i = 0; i < 5; ++i) {
    cluster.removeOverlaps({
      pullX: true
    });
  }
  cluster.removeOverlaps();

//  let cityRoot = new GraphLayer(cluster.graph);

  // var newRoot;
  // do {
  //   // todo: i need to ignore isolated clusters, and add them at the end.
  //   newRoot = cityRoot.split();
  //   if (newRoot) cityRoot = newRoot;
  // } while (newRoot)

  // for (let i = 0; i < 200; ++i) {
  //   cityRoot.step();
  // }
  // let positions = cityRoot.buildNodePositions();
  // tightenUp(positions);
  // cluster.graph.forEachNode(node => {
  //   let pos = positions.get(node.id);
  //   if (!pos) throw new Error('missing position for node ', node.id);
  //   cluster.layout.setNodePosition(node.id, pos.x, pos.y)
  // });
}

function tightenUp(points) {
  let rectangels = new Map();
  points.forEach((point, id) => {
    let size = 20; // todo: adjust 

    let rect = new Rect({
      left: point.x - size/2,
      top: point.y - size/2,
      width: size,
      height: size,
      id: id
    });
    rectangels.set(id, rect);
  });
  for (let i = 0; i < 10; ++i) {
    removeOverlaps(rectangels, {
      pullX: true
    });
  }

  rectangels.forEach(rect => {
    let p = points.get(rect.id);
    p.x = rect.cx;
    p.y = rect.cy;
  })
}

module.exports = init;

function peprocessGraphNodeSize(graph) {
  let score = pagerank(graph);
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY
  Object.keys(score).forEach(nodeId => {
    let nodeScore = score[nodeId];
    if (nodeScore > max) max = nodeScore;
    if (nodeScore < min) min = nodeScore;
  });

  let distr = []
  graph.forEachNode(node => {
    let nodeScore = score[node.id];
    let bucket = getBucket(nodeScore, min, max, 20) + 6;
    distr.push(bucket);

    if (!node.data) node.data = {};
    node.data.size = bucket * 2;
  })

  window.distr = distr;
}

function getBucket(value, min, max, bucketsCount) {
  let slice = (value - min) / (max - min);
  return Math.round(slice * bucketsCount);
}
