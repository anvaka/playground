const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const miserables = require('miserables')
const clusterLayout = require('../lib/clusterLayout');

module.exports = getBooksGraph;

function getBooksGraph() {
    let booksData = require('./books_no_pull.json')
    let graph = parseJSONGraph(booksData);
    return graph;
}

function getGraph() {
  const useMySocialNetwork = true;

  // Note: anvaka.json is not committed. I don't want to share my social graph :).
  let graph;
  if (useMySocialNetwork) {
    let socialData = require('./anvaka.json')
    graph = parseJSONGraph(socialData);
  } else {
    graph = miserables
  }

  const useClusterLayout = true;
  const layout = useClusterLayout ? getClusterLayout(graph) : getNormalLayout(graph);

  graph.forEachNode(n => {
    let pos = layout.getNodePosition(n.id);
    n.data = {
      x: pos.x,
      y: pos.y
    }
  })

  return graph;
}

function parseJSONGraph(jsonGraph) {
  const graph = createGraph({uniqueLinkId: false});

  jsonGraph.nodes.forEach(n => {
    graph.addNode(n.id, n.data);
  });
  
  jsonGraph.links.forEach(l => {
    graph.addLink(l.fromId, l.toId)
  })

  return graph;
}


function getClusterLayout(graph) {
  return clusterLayout(graph);
}

function getNormalLayout(graph) {
  const layout = createLayout(graph, {
    // springLength: 200
  })
  for (let i = 0; i < 1000; ++i) {
    layout.step()
  }

  return layout;
}