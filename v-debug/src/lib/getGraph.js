var fromJson = require('ngraph.fromjson');
var data = require('../data/anvaka_twitter.json')

module.exports = getGraph;

function getGraph() {
  return fromJson(data);
}