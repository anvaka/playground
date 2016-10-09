var graph = require('miserables');

// 1. Sort nodes by degree. The node size is proportional to degree
// 2. Place each node into its own 'cell'
// 3. The placement of a cell is determined by edges.
var scene = createScene(document.getElementById('scene'));

var layoutManager = createLayoutManager(graph);
var nodes = getNodes(graph).sort(byDegree);

nodes.forEach(node => {
  var placement = layoutManager.getPosition(node);
  scene.draw(node, placement);
});

function byDegree(a, b) {
  return b.degree - a.degree;
}

function getNodes(graph) {
  var nodes = [];

  graph.forEachNode(function(node) {
    nodes.push({
      id: node.id,
      node: node,
      degree: getDegree(node.id)
    });
  });

  return nodes;

  function getDegree(nodeId) {
    var links = graph.getLinks(nodeId);
    return links ? links.length : 0;
  }
}

function createLayoutManager(graph) {
  var nodesCount = graph.getNodesCount();

  return {
    getPosition: getPosition
  };

  function getPosition(node) {
    // For now, we just do it randomly. But this will be our core:
    var size = node.degree + 1;
    return {
      size: size,
      cx: Math.random() * nodesCount * 10,
      cy: Math.random() * nodesCount * 10,
    };
  }
}

function createScene(domElement) {
  domElement.width = window.innerWidth;
  domElement.height = window.innerHeight;

  var ctx = domElement.getContext('2d');

  return {
    draw: draw
  }

  function draw(node, placement) {
    var size = placement.size;
    ctx.fillStyle = '#00bfff'
    ctx.fillRect(placement.cx - size/2, placement.cy - size/2, size, size);
    ctx.fill();
  }
}
