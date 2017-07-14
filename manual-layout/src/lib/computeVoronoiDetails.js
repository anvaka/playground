const voronoi = require('d3-voronoi').voronoi
const createGraph = require('ngraph.graph')

module.exports = computeVoronoiDetails

function computeVoronoiDetails (positions) {
  const v = voronoi()
    .x(r => r.cx)
    .y(r => r.cy)
    .extent([[positions.bounds.minX, positions.bounds.minY], [
      positions.bounds.maxX,
      positions.bounds.maxY
    ]])

  const corners = convertPositionsToVoronoiPoints(positions)
  let computed = v(corners)
  let polygons = computed.polygons()
  let polygonsPath = getVoronoiPolygonsPath(polygons)
  let centerLookup = new Map()
  positions.forEach(p => centerLookup.set(p.id, p))

  let voronoiGraph = getVoronoiGraph(polygons, corners, centerLookup)

  console.log('Voronoi graph', voronoiGraph.getLinksCount() + ',' + voronoiGraph.getNodesCount())

  let delaunayPath = computed.links().map(l => {
    return 'M' + l.source.cx + ',' + l.source.cy + ' ' +
      'L' + l.target.cx + ',' + l.target.cy
  })

  return {
    polygonsPath,
    delaunayPath,
    graph: voronoiGraph
  }
}

function getVoronoiGraph (polygons, corners, rectPositions) {
  const g = createGraph({uniqueLinkId: false})
  const parentNodeToVoronoiNodeLookup = new Map()
  const g1 = createGraph({uniqueLinkId: false})

  g.parentLookup = parentNodeToVoronoiNodeLookup

  var i;
  for (i = 0; i < polygons.length; ++i) {
    var p = polygons[i]
    if (!p) continue

    let fromId = point(p[0])
    let start = fromId

    const parentNodeId = corners[i].id
    const parentPosition = rectPositions.get(parentNodeId)
    let nearestEntryPoints = parentNodeToVoronoiNodeLookup.get(parentNodeId)
    if (!nearestEntryPoints) {
      nearestEntryPoints = new Set()
      parentNodeToVoronoiNodeLookup.set(parentNodeId, nearestEntryPoints)
    }

    let smallestDistance = Number.POSITIVE_INFINITY

    g.addNode(fromId, {
      parentNodeId,
      pos: p[0]
    })

    // remember which node in tesselation is the nearest to the actual corner point
    let currentDistance = distanceSquared(p[0], parentPosition)
    smallestDistance = currentDistance
    let smallestNodeId = [fromId]

    for (let j = 1; j < p.length; ++j) {
      let toId = point(p[j])
      g.addNode(toId, {
        parentNodeId,
        pos: p[j]
      })

      let currentDistance = distanceSquared(p[j], parentPosition)
      if (currentDistance < smallestDistance) {
        smallestDistance = currentDistance
        smallestNodeId = [toId]
      } else if (currentDistance === smallestDistance) {
        smallestNodeId.push(toId)
      }

      if (!g.hasLink(fromId, toId) && fromId !== toId) g.addLink(fromId, toId)
      fromId = toId
    }

    if (!g.hasLink(fromId, start) && fromId !== start) g.addLink(fromId, start)

    smallestNodeId.forEach(s => {
      nearestEntryPoints.add(s)
      g1.addNode(s, g.getNode(s).data)
    })
  }

  return g
}

function distanceSquared (a, b) {
  return (a[0] - b.cx) * (a[0] - b.cx) + (a[1] - b.cy) * (a[1] - b.cy)
}

function getVoronoiPolygonsPath (polygons) {
  let pPath = ''

  for (let i = 0; i < polygons.length; ++i) {
    pPath += drawCell(polygons[i]) + ' '
  }

  return pPath

  function drawCell (cell) {
    if (!cell) return ''
    return 'M' + point(cell[0]) + cell.slice(1).map(x => 'L' + point(x)).join(' ') + 'Z'
  }
}

function point (a) {
  return a[0] + ',' + a[1]
}

function convertPositionsToVoronoiPoints (positions) {
  let points = []

  positions.forEach(p => {
    let dw = p.width * 0.25
    let dh = p.height * 0.25
    points.push(
      {
        id: p.id,
        cx: p.cx,
        cy: p.cy
      },
      // {
      //   id: p.id,
      //   cx: p.left,
      //   cy: p.top
      // }, {
      //   id: p.id,
      //   cx: p.right,
      //   cy: p.top
      // }, {
      //   id: p.id,
      //   cx: p.right,
      //   cy: p.bottom
      // }, {
      //   id: p.id,
      //   cx: p.left,
      //   cy: p.bottom
      // },
      {
        id: p.id,
        cx: p.left - dw,
        cy: p.top - dh
      }, {
        id: p.id,
        cx: p.right + dw,
        cy: p.top - dh
      }, {
        id: p.id,
        cx: p.right + dw,
        cy: p.bottom + dh
      }, {
        id: p.id,
        cx: p.left - dw,
        cy: p.bottom + dh
      }
    )
  })

  return points
}
