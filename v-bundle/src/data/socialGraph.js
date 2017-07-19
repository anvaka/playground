const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const miserables = require('miserables')

module.exports = getGraph

function getGraph() {
  // const graph = createGraph({uniqueNodeIds: false});
  // const data = require('./anvaka.json')
  const graph = miserables;
  const layout = createLayout(graph)

  // data.nodes.forEach(n => {
  //   graph.addNode(n.id);
  // });
  //
  // data.links.forEach(l => {
  //   graph.addLink(l.fromId, l.toId)
  // })

  for (let i = 0; i < 1000; ++i) {
    layout.step()
  }

  // data.nodes.forEach(n => {
  //   let pos = layout.getNodePosition(n.id);
  //   graph.addNode(n.id, {
  //     x: pos.x,
  //     y: pos.y
  //   })
  // })

  graph.forEachNode(n => {
    let pos = layout.getNodePosition(n.id);
    n.data = {
      x: pos.x,
      y: pos.y
    }
  })
  return graph;
}
