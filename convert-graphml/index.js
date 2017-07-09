var graphml = require('graphml-js');
var fs = require('fs');
 
var createGraph = require('ngraph.graph');
var tojson = require('ngraph.tojson');
var graphmlText = fs.readFileSync('airlines.xml');
var parser = new graphml.GraphMLParser();
 
parser.parse(graphmlText, function(err, srcGraph) {
  var graph = createGraph();
  srcGraph.nodes.forEach(n => {
    graph.addNode(n._id, n._attributes)
  });
  srcGraph.edges.forEach(e => {
    graph.addLink(e._source, e._target, e._attributes)
  })

  console.log(tojson(graph))
});
