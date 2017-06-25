const createGraph = require('ngraph.graph')

const graph = createGraph({})

module.exports = graph

const data = getData()

let min = Number.POSITIVE_INFINITY
let max = Number.NEGATIVE_INFINITY
let sum = 0

data.nodes.forEach(n => {
  if (n.data !== undefined) {
    if (n.data < min) min = n.data
    if (n.data > max) max = n.data
    sum += n.data
  }
})

let mean = sum / data.nodes.length
let variance = 0

data.nodes.forEach(n => {
  if (n.data !== undefined) {
    variance += (n.data - mean) * (n.data - mean)
  } else {
    n.data = mean
  }
  graph.addNode(n.id, n.data)
})

variance /= data.nodes.length
variance = Math.sqrt(variance)

data.links.forEach(l => graph.addLink(l.fromId, l.toId))

graph.forEachNode(n => {
  // n.data = 10 + (n.data - min) / (max - min)
  const x = (n.data - mean) / variance
  console.log(x)
  n.data = (3 + x) * 7 // (1 + (n.data - 1241) / 106281) * 10
})

function getData () {
  return require('./1183.json')
}
