const gen = require('ngraph.generators');
const createGraph = require('ngraph.graph');

var qs = require('query-state')({
  k1: 0.99,
  k2: 1,
  k3: 0.1,
  k4: 0,

  // graph to load by default
  graph: 'miserables',
  p0: 10,
  p1: 10,
  p2: 10
}, {
  useSearch: true
});

// get current application state from the hash string:
var settings = qs.get();

const appState = {
  getGraph,
  settings: {
    k1: settings.k1, 
    k2: settings.k2,
    k3: settings.k3,
    k4: settings.k4 
  },
}

qs.onChange(function(appState) {
  // TODO: Implement me
});

export default appState

function getGraph() {
  var generator = gen[settings.graph];
  if (generator) {
    return generator(settings.p0, settings.p1, settings.p2);
  }
  return require('miserables').create()
  // // var g = createGraph();
  // // g.addLink('a', 'b');
  // // g.addLink('a', 'c');
  // // g.addLink('a', 'f');
  // // g.addLink('a', 'g');
  // // // g.addLink('f', '1');
  // // // g.addLink('f', '2');
  // // // g.addLink('f', '3');
  // // // g.addLink('f', '4');
  // // return g;
  // return require('miserables').create();
  // var mtxObject = require('ngraph.sparse-collection/HB/662_bus');
  // var mtxParser = require('ngraph.serialization/mtx');
  // return mtxParser.loadFromObject(mtxObject);
  return gen.grid3(50, 10, 6); //70, 10, 4);
}