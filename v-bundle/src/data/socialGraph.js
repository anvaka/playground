const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const miserables = require('miserables')

module.exports = getGraph

function getGraph() {
  const graph = createGraph({uniqueLinkIds: false});
  for (var i = 2; i < 300; ++i) {
    graph.addLink(1, i);
  }

  // const data = require('./anvaka.json')
  //const graph = miserables;

  // data.nodes.forEach(n => {
  //   graph.addNode(n.id);
  // });
  
  // data.links.forEach(l => {
  //   graph.addLink(l.fromId, l.toId)
  // })

  // const layout = createLayout(graph)
  // for (let i = 0; i < 1000; ++i) {
  //   layout.step()
  // }

  // graph.forEachNode(n => {
  //   let pos = layout.getNodePosition(n.id);
  //   n.data = {
  //     x: pos.x,
  //     y: pos.y
  //   }
  // })
  graph.forEachNode(n => {
    let pos;
    if (n.id === 1) {
      pos = { x: 0, y: 0 }
    } else {
      pos = {
        x: 100 * Math.cos(n.id/300 * Math.PI * 2),
        y: 100 * Math.sin(n.id/300 * Math.PI * 2),
      }
    }
    n.data = pos
  })
  return graph;
}
