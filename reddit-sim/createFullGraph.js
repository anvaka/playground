var forEachSub = require('./lib/forEachSub');
var createGraph = require('ngraph.graph');
var todot = require('ngraph.todot');

loadGraph().then(printGraph)

function loadGraph() {
  var aResolve, aReject;
  var graph = createGraph();

  forEachSub('all.json', (sub) => {
    var from = sub.name;
    sub.similar.forEach(sim => {
      var to = sim.sub;
      if (!graph.hasLink(from, to)) graph.addLink(from, to);
    })
  }, (err) => {
    if (err) aReject(err);
    aResolve(graph);
  });

  return new Promise((resolve, reject) => {
    aResolve = resolve;
    aReject = reject;
  });
}

function printGraph(graph) {
  console.log(todot(graph));
}
