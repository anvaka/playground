var ngraphLayout = require('ngraph.forcelayout');
var d3 = require('d3-force');
var getFloatOrDefault = require('./getFloatOrDefault');
// const setInitialLayout = require('./setInitialLayout');

module.exports = makeLayout;

function makeLayout(graph, settings) {
  if (settings.selectedLayout === 'ngraph') {
    return ngraphLayout(graph, extractSettings(settings));
  }

  return d3Layout(graph, settings);
}

function extractSettings(settings) {
  return {
   springLength: getFloatOrDefault(settings.springLength,  30),
   springCoeff : getFloatOrDefault(settings.springCoeff,   0.0008),
   gravity     : getFloatOrDefault(settings.gravity,       -1.2),
   theta       : getFloatOrDefault(settings.theta,         0.8),
   dragCoeff   : getFloatOrDefault(settings.dragCoeff,     0.02),
   timeStep    : getFloatOrDefault(settings.timeStep,      20)
  };
}


function d3Layout(graph, settings) {
  var api = {
    getNodePosition,
    step
  };

  var nodes = [];
  var nodeIndexLookup = new Map();
  graph.forEachNode(n => {
    var d3Node = {
      id: n.id
    };
    nodes.push(d3Node);
    nodeIndexLookup.set(n.id, nodes.length - 1);
  });
  var links = [];

  graph.forEachLink(link => {
    links.push({
      source: nodeIndexLookup.get(link.fromId),
      target: nodeIndexLookup.get(link.toId),
    });
  })

  var springLength = getFloatOrDefault(settings.springLength,  30);
  var link = d3.forceLink(links).distance(function() {
    return springLength;
  })
  var gravity = getFloatOrDefault(settings.gravity, -30);
  var nbody = d3.forceManyBody()
    .theta(getFloatOrDefault(settings.theta, 0.8))
    .strength(function() {
      return gravity;
    })
  var simulation = d3.forceSimulation(nodes)
    .force("charge", nbody)
    .force("link", link)
    .force("center", d3.forceCenter());

  simulation.stop()

  return api;

  function step() {
    simulation.tick();
  }

  function getNodePosition(nodeId) {
    var idx = nodeIndexLookup.get(nodeId);
    return nodes[idx];
  }
}