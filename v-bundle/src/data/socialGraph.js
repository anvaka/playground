const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const miserables = require('miserables')
const clusterLayout = require('../lib/clusterLayout');

module.exports = getGraph

function getGraph() {
  const useMySocialNetwork = true;
  const graph = useMySocialNetwork ? getMySocialNetwork() : miserables;

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

function getMySocialNetwork() {
  const graph = createGraph({uniqueLinkId: false});
  // Note: anvaka.json is not committed. I don't want to share my social graph :).
  const data = require('./anvaka.json')

  data.nodes.forEach(n => {
    graph.addNode(n.id);
  });
  
  data.links.forEach(l => {
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