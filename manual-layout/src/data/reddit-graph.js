const createGraph = require('ngraph.graph')

const graph = createGraph({})
module.exports = graph

const data = getData()
data.nodes.forEach(n => graph.addNode(n.id))
data.links.forEach(l => graph.addLink(l.fromId, l.toId))

function getData () {
  return require('./gamedev.json')
}
