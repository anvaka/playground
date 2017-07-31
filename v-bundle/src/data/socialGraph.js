const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const miserables = require('miserables')
const generator = require('ngraph.generators');

module.exports = getGraph

function getGraph() {
  // const graph = createGraph({uniqueLinkIds: false});
  // graph.addLink(1, 2);
  // graph.addLink(1, 3);
  // graph.addLink(2, 5);
  // graph.addLink(2, 6);
  // const graph = generator.wattsStrogatz(100, 20, 0.00)

  // const data = require('./anvaka.json')
  const graph = miserables;

  // data.nodes.forEach(n => {
  //   graph.addNode(n.id);
  // });
  
  // data.links.forEach(l => {
  //   graph.addLink(l.fromId, l.toId)
  // })

  const layout = createLayout(graph, {
    // springLength: 200
  })
  for (let i = 0; i < 1000; ++i) {
    layout.step()
  }

  graph.forEachNode(n => {
    let pos = layout.getNodePosition(n.id);
    n.data = {
      x: pos.x,
      y: pos.y
    }
  })
  // graph.forEachNode(n => {
  //   let pos;
  //   pos = {
  //     x: 100 * Math.cos(n.id/nodeCount * Math.PI * 2),
  //     y: 100 * Math.sin(n.id/nodeCount * Math.PI * 2),
  //   }
  //   n.data = pos
  // })
  return graph;
}
