var graph = require('miserables');

// 1. Sort nodes by degree. The node size is proportional to degree
// 2. Place each node into its own 'cell'
// 3. The placement of a cell is determined by edges.
var scene = createScene(document.getElementById('scene'));

var nodes = getNodes(graph).sort(byDegree);
var layoutManager = createLayoutManager(nodes);

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
    var links = graph.getLinks(node.id) || [];

    nodes.push({
      id: node.id,
      node: node,
      links: links,
      degree: links.length
    });
  });

  return nodes;
}

function createLayoutManager(nodes) {
  var positions = new Map(); // map from id to node position
  var idToNode = indexNodes();
  layout();

  return {
    getPosition: getPosition
  };

  function indexNodes() {
    var index = new Map();
    nodes.forEach(function(node) { index.set(node.id, node); });

    return index;
  }

  function getPosition(node) {
    return positions.get(node.id);
  }

  function layout() {
    // Let's explore from the simple idea:
    // 1. Place the largest node (by degree) in available spot
    // 2. Place each unvisited neighbour in the nearest unoccupied cell
    nodes.forEach(function(node) {
      placeNode(node.id);
    });

    function placeNode(nodeId, nearestNeighbourId) {
      if (positions.has(nodeId)) return; // already placed

      var cell = findSpot(nodeId, nearestNeighbourId);
      positions.set(nodeId, cell);

      var node = idToNode.get(nodeId);

      node.links.forEach(function(link) {
        if (link.fromId === nodeId) {
          placeNode(link.toId, link.fromId);
        }
      });
    }

    function findSpot(nodeId) {
      return {
        cx: Math.random() * nodes.length * 10,
        cy: Math.random() * nodes.length * 10,
        size: (idToNode.get(nodeId).links.length + 1) * 2
      }
    }
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
