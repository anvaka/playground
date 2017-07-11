const createGraph = require('ngraph.graph')

const graph = createGraph({})

module.exports = graph

const data = require('./airlines.json')

data.nodes.forEach(n => {
  graph.addNode(n.id, n.data)
})

data.links.forEach(l => {
  graph.addLink(l.fromId, l.toId)
})
