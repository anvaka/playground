const createGraph = require('ngraph.graph')

const graph = createGraph({})

module.exports = graph

const data = require('./anvaka.json')
const idToName = new Map()

data.nodes.forEach(n => {
  let id = idToName.get(n.id)
  if (!id) {
    id = n.data.name + n.id
    idToName.set(n.id, id)
  }

  graph.addNode(id)
})

data.links.forEach(l => {
  let fromId = idToName.get(l.fromId)
  let toId = idToName.get(l.toId)
  graph.addLink(fromId, toId)
})
