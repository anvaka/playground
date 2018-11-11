var createLayout = require('ngraph.offline.layout');
var forEachSub = require('./lib/forEachSub');
var createGraph = require('ngraph.graph');
var tobinary = require('ngraph.tobinary');

loadGraph().then(doLayout)

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

function doLayout(graph) {
  var layout = createLayout(graph, {
    iterations: 500, 
    saveEach: 10, // Save each `10th` iteration
    outDir: './layout',
  });
  layout.run();
  tobinary(graph, {
    outDir: './layout'
  })
}