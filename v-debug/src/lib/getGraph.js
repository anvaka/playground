var fromJson = require('ngraph.fromjson');
var data = require('../data/anvaka_twitter.json')

module.exports = getGraph;

function getGraph() {
  let graph = fromJson(data);
  // don't let vue modify this, it's unnecessary
  Object.freeze(graph);
  return graph;
}