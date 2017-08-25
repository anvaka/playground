var fromJson = require('ngraph.fromjson');
var data = require('../data/anvaka_twitter.json')
// var createGraph = require('ngraph.graph');

module.exports = getGraph;

function getGraph() {
  let graph = fromJson(data);
  // let graph = createGraph();
  // graph.addLink(1, 2);
  // graph.addLink(1, 4);
  // graph.addLink(1, 3);
  // graph.addLink(4, 6);
  // don't let vue modify this, it's unnecessary
  Object.freeze(graph);
  return graph;
}