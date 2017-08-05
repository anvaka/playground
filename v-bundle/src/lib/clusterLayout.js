const createLayout = require('ngraph.forcelayout')
const coarsen = require('ngraph.coarsen');
var detectClusters = require('ngraph.louvain');
module.exports = clusterLayout;

function clusterLayout(graph) {
  var clusters = detectClusters(graph);
  var coarsedGraph = coarsen(graph, clusters);
  var nodePositions = new Map(); // maps node id into global position (x, y)

  // TODO: this needs to account dimensions of cells.
  const parentLayout = createLayout(coarsedGraph, {
    springLength: 400,
    nodeMass(nodeId) {
      return coarsedGraph.getNode(nodeId).data.size;
    }
  })
  
  for (let i = 0; i < 1000; ++i) {
    parentLayout.step();
  }

  var subgraphs = coarsen.getSubgraphs(coarsedGraph);
  subgraphs.forEach((subgraph) => {
    var graph = subgraph.graph;
    var parentPosition = parentLayout.getNodePosition(subgraph.id);

    // TODO: add support nodes to the graph. Each support node should be placed on circumference
    // of a bounding box. What should it be connected to? We need to choose nearest support node
    // based on angle between parent nodes. Question: Can one node be connected to multiple support nodes?
    // Yes! We should also include weights of those connections. E.g. if a is connected to b and c in cluaster 1,
    // then the weight to the support cluster node 1 should be 2... I assume this should rotate layout appropriately
    // TODO: I also think it's a good time to start a new playground just for this.
    var layout = createLayout(graph, {
        springLength : 15,
        springCoeff : 0.0003,
        dragCoeff : 0.05,
        gravity : -0.8,
        theta : 0.5
     });
    var iterationsCount = Math.max(50, graph.getNodesCount() * 2); // TODO: change this if it is bad?
    for(let i = 0; i < 1000; ++i) {
      layout.step()
    }

    // now we need to propagate positions to the global layout
    graph.forEachNode(function (node) {
      var localPosition = layout.getNodePosition(node.id);

      nodePositions.set(node.id, {
        x: localPosition.x + parentPosition.x,
        y: localPosition.y + parentPosition.y,
      })
    });
  })

  return {
    getNodePosition(nodeId) {
      return nodePositions.get(nodeId);
    }
  };
}