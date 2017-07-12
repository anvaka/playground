const Delaunay = require('delaunay-fast')
const createGraph = require('ngraph.graph')

module.exports = getTriangulated;

class TriangleModel {
  constructor (p1, p2, p3) {
    this.p1 = p1
    this.p2 = p2
    this.p3 = p3

    this.path = `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}`
  }

  getPath () {
    return this.path
  }
}

function getTriangulated(graph) {
  let minWeight = Number.POSITIVE_INFINITY;
  let maxWeight = Number.NEGATIVE_INFINITY;

  // updateApiPositions()
  let vertices = []
  let vPos = new Map();
  let splitSize = 15;

  graph.forEachLink(l => {
    // if (l.fromId === '15' || l.toId === '15') {
    //   debugger
    // }
    let from = graph.getNode(l.fromId).data
    let to = graph.getNode(l.toId).data
    let length = getLength(from, to);
    let ux = (to.x - from.x)/length
    let uy = (to.y - from.y)/length
    let partsCount = Math.floor(length / splitSize)
    if (partsCount === 0) {
      let fromPair = [from.x, from.y]
      fromPair.id = l.fromId
      vertices.push(fromPair)
      vPos.set(fromPair.id, fromPair)

      let toPair = [to.x, to.y]
      toPair.id = l.toId
      vertices.push(toPair)
      vPos.set(toPair.id, toPair)
      return;
    }

    var i = 0;
    for (i = 0; i < partsCount; ++i) {
      let x = from.x + i * splitSize * ux;
      let y = from.y + i * splitSize * uy;

      let pair = [x, y]
      if (i === 0) {
        pair.id = l.fromId
      } else {
        pair.id = l.fromId + '_' + i
      }
      vPos.set(pair.id, pair);
      vertices.push(pair)
    }
    if (length > partsCount * splitSize) {
      let pair = [to.x, to.y]
      pair.id = l.toId;
      vertices.push(pair)
      vPos.set(pair.id, pair);
    } else {
      let pair = vertices[vertices.legnt - 1];
      pair.id = l.toId;
      vPos.set(pair.id, pair);
    }
  })

  const triangles = Delaunay.triangulate(vertices)
  const triangulationGraph = createGraph({ uniqueLinkId: false })
  const triangulation = []

  for (let i = triangles.length; i;) {
    --i
    const first = vertices[triangles[i]]
    const p0 = [ first[0], first[1] ]
    --i
    const second = vertices[triangles[i]]
    const p1 = [ second[0], second[1] ]
    --i
    const third = vertices[triangles[i]]
    const p2 = [ third[0], third[1] ]
    const node = new TriangleModel(p0, p1, p2)
    triangulation.push(node)

    addTriangulationLink(first.id, second.id, triangulationGraph)
    addTriangulationLink(second.id, third.id, triangulationGraph)
    addTriangulationLink(third.id, first.id, triangulationGraph)
  }

  const api = {
    graph: triangulationGraph,
    positions: [],
    edges: [],
    getWeight,
    getNodePosition,
    layout: { getNodePosition }
  }
  triangulationGraph.forEachNode(n => {
    n.data = getNodePosition(n.id);
  });
  return api

  function addTriangulationLink (fromId, toId, tGraph) {
    if (tGraph.hasLink(fromId, toId) || tGraph.hasLink(toId, fromId)) return;
    tGraph.addLink(fromId, toId)
  }

  function getLength(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getWeight(link) {
    return link.weight/(maxWeight - minWeight)
  }

  function getNodePosition(nodeId) {
    let pair = vPos.get(nodeId)
    return {
      x: pair[0],
      y: pair[1]
    }
  }

  function getLength(from, to) {
    let dy = to.y - from.y;
    let dx = to.x - from.x
    return Math.sqrt(dx * dx  + dy * dy)
  }
}
