let createRandom = require('ngraph.random')
let toGraph = require('./toGraph');
let npath = require('ngraph.path');

let distances = {
  manhattan,
  lonLat,
  projected,
  canberra
}

module.exports = function setup(scene, options) {
  options = options || {};
  const random = createRandom(42);
  let count = options.pathCount || 2000;
  let distanceFunction = projected;
  if (typeof options.distance === 'function') {
    distanceFunction = options.distance;
  } else if (distances[options.distance]) {
    distanceFunction = distances[options.distance];
  }

  let firstLayer = scene.queryLayer();
  let projector = firstLayer.grid.getProjector();

  let keys = Array.from(firstLayer.grid.nodes.keys());

  //let fromId = keys[Math.floor(random.nextDouble() * keys.length)];
  let graph = toGraph(firstLayer)
  let linksCount = graph.getLinksCount();
  let wgl = scene.getWGL();
  let c = firstLayer.color.toRgb();

  // scene.clear();
  const pathLimit = linksCount * 10;
  let betweenLines = new wgl.WireCollection(pathLimit);
  if (options.name) betweenLines.name = options.name;
  betweenLines.color = {r: c.r/255, g: c.g/255, b: c.b/255, a: 0.05}
  let wglRenderer = scene.getRenderer()
  wglRenderer.appendChild(betweenLines);

  let totalAdded = 0;
  let explored = 0;

  let pathFinder = npath.nba(graph, {
      distance: distance,
      heuristic: distance
  });

  let handle = setTimeout(compute, 0);
  return {
    dispose,
    lines: betweenLines
  }

  function dispose() {
    clearTimeout(handle);
  }

  function compute() {
    let fromId = keys[Math.floor(random.nextDouble() * keys.length)];
    let toId = keys[Math.floor(random.nextDouble() * keys.length)];

    let found = pathFinder.find(fromId, toId).map(l => l.data);

    for (let i = 1; i < found.length; ++i) {
      betweenLines.add({from: projector(found[i - 1]), to: projector(found[i])});
    }

    totalAdded += found.length;
    explored += 1;
    if (totalAdded < pathLimit && explored < count) {
      handle = setTimeout(compute, 0);
    }
    if (explored % 50 === 0) {
      console.info('Explored ' + explored + ' shortest paths.');
    }
    scene.render();
  }

  function distance(n1, n2) {
    return distanceFunction(n1.data, n2.data);
  }
}

function canberra(node1, node2) {
  return Math.abs(node1.lat - node2.lat)/(Math.abs(node1.lat) + Math.abs(node2.lat)) + 
    Math.abs(node1.lon - node2.lon)/(Math.abs(node1.lon) + Math.abs(node2.lon));
}

function manhattan(node1, node2) {
  return Math.abs(node1.lat - node2.lat) + Math.abs(node1.lon - node2.lon);
}

function lonLat(node1, node2) {
  return Math.hypot(node1.lat - node2.lat, node1.lon - node2.lon);
}

function projected(node1, node2) {
  let p = 0.017453292519943295;    // Math.PI / 180
  let c = Math.cos;
  let a = 0.5 - c((node2.lat - node1.lat) * p)/2 + 
          c(node1.lat * p) * c(node2.lat * p) * 
          (1 - c((node2.lon - node1.lon) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

module.exports.distances = distances;