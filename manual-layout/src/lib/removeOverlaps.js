const Delaunay = require('delaunay-fast')
const findMinimumSpanningTree = require('ngraph.kruskal')
const makeSpanningTree = require('./spanningTree.js')
const EdgeModel = require('./EdgeModel.js')
const createGraph = require('ngraph.graph')
const TriangleModel = require('./TriangleModel.js')

module.exports = removeOverlaps

/**
 * For a given set of rectangles, removes overlaps
 *
 * @param {Map} rectangles - rectId -> Rectangle mapping
 */
function removeOverlaps (rectangles, options) {
  const triangulation = []
  // Convert rectangle centers into vertices, that we can feed into Delaunay
  // triangulation
  const vertices = []
  options = options || {}

  const canMove = options.canMove || yes
  const pullX = options.pullX || false
  const pullY = options.pullY || false

  rectangles.forEach(r => {
    const pair = [r.cx, r.cy]
    pair.id = r.id
    vertices.push(pair)
  })

  const triangles = Delaunay.triangulate(vertices)
  const triangulationGraph = createGraph({ uniqueLinkId: false })

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

  const mst = findMinimumSpanningTree(triangulationGraph, e => e.data)
  const mstEdges = mst.map(edge => new EdgeModel(
    getRect(edge.fromId),
    getRect(edge.toId)
  ))

  if (mstEdges.length > 0) {
    const spanningTree = makeSpanningTree(mstEdges)

    grow(spanningTree)
  }

  return

  function getRect (id) {
    return rectangles.get(id)
  }

  function grow (spanningTree) {
    const spanningGraph = spanningTree.getGraph()

    const processed = new Set()
    growAt(spanningTree.getRootId())

    function growAt (nodeId) {
      if (processed.has(nodeId)) return

      processed.add(nodeId)

      const rootPos = getRect(nodeId)

      spanningGraph.forEachLinkedNode(nodeId, otherNode => {
        if (processed.has(otherNode.id)) return

        const childPos = getRect(otherNode.id)
        if (overlaps(rootPos, childPos)) {
          const t = getOverlapFactor(rootPos, childPos)
          const dx = (childPos.cx - rootPos.cx)
          const dy = (childPos.cy - rootPos.cy)

          if (canMove(otherNode.id)) {
            childPos.cx = rootPos.cx + t * dx
            childPos.cy = rootPos.cy + t * dy
          } else {
            rootPos.cx = childPos.cx - t * dx
            rootPos.cy = childPos.cy - t * dy
          }
        }
        growAt(otherNode.id)
      })
    }
  }

  /**
  * Given two rectangles returns a value by which they overlap
  */
  function getOverlapFactor (a, b) {
    const dx = Math.abs(a.cx - b.cx)
    const dy = Math.abs(a.cy - b.cy)

    const wx = (a.width + b.width) / 2
    const wy = (a.height + b.height) / 2

    const t = Math.min(wx / dx, wy / dy)
    return t
  }

  function addTriangulationLink (fromId, toId, tGraph) {
    const from = getRect(fromId)
    const to = getRect(toId)
    const weight = getTriangulationWeight(from, to)

    tGraph.addLink(fromId, toId, weight)
  }

  function getTriangulationWeight (a, b) {
    if (overlaps(a, b)) {
      const centerDistance = getPointDistance(a, b)
      const t = getOverlapFactor(a, b)
      return -(t - 1) * centerDistance
    }

    return getRectangularDistance(a, b)
  }

  function overlaps (a, b) {
    // If one rectangle is on left side of other
    // NOTE: This gives funny results when we always return true
    if (a.left > b.right || b.left > a.right) return pullX

    // If one rectangle is above other
    if (a.top > b.bottom || b.top > a.bottom) return pullY

    return true
  }

  function getRectangularDistance (a, b) {
    if (overlaps(a, b)) return 0
    let dx = 0
    let dy = 0

    if (a.right < b.left) {
      dx = b.right - a.left
    } else if (b.right < a.left) {
      dx = a.left - b.right
    }

    if (a.top < b.bottom) {
      dy = b.bottom - a.top
    } else if (b.top < a.bottom) {
      dy = a.bottom - b.top
    }

    return Math.sqrt(dx * dx + dy * dy)
  }

  function getPointDistance (a, b) {
    const dx = a.cx - b.cx
    const dy = a.cy - b.cy

    return Math.sqrt(dx * dx + dy * dy)
  }
}

function yes () {
  return true
}
