const Delaunay = require('delaunator');
const createGraph = require('ngraph.graph')

module.exports = getDelaunayGraph;

function getDelaunayGraph(vertices, getX, getY) {
  const delaunay = new Delaunay(vertices, getX, getY);
  const triangles = delaunay.triangles;
  // const triangles = Delaunay.triangulate(vertices)
  const triangulationGraph = createGraph({ uniqueLinkId: false })
  vertices.forEach(v => {
    triangulationGraph.addNode(v.id, v);
  });

  for (let i = triangles.length; i;) {
    --i
    const first = vertices[triangles[i]]
    --i
    const second = vertices[triangles[i]]
    --i
    const third = vertices[triangles[i]]

    addTriangulationLink(first.id, second.id, triangulationGraph)
    addTriangulationLink(second.id, third.id, triangulationGraph)
    addTriangulationLink(third.id, first.id, triangulationGraph)
  }

  return triangulationGraph;
}

function addTriangulationLink (fromId, toId, tGraph) {
  tGraph.addLink(fromId, toId)
}