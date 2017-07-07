const createGraph = require('ngraph.graph')

module.exports = readGraph;

function readGraph(ctx) {
  let data = require(ctx.fileName);

  const graph = createGraph({uniqueLinkId: false});

  data.nodes.forEach(n => {
    graph.addNode(n.id)
  })

  data.links.forEach(l => {
    graph.addLink(l.fromId, l.toId)
  })

  ctx.graph = graph
  return ctx;
}

