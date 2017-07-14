const shortestPath = require('./findShortestPaths.js')

module.exports = getVoronoiPath;

function getVoronoiPath(voronoiGraph, srcGraph) {
  let findShortestPaths = shortestPath(voronoiGraph)
  let tesselation = voronoiGraph.parentLookup
  let voronoiLinks = new Map() // linkId => link shortest path on voronoi tesslation

  console.time('Shortest paths')
  srcGraph.forEachLink(l => {
    let fromTIds = tesselation.get(l.fromId)
    let toTIds = tesselation.get(l.toId)
    if (!fromTIds || !toTIds) {
      // This can happen when a point didn't have a polygon
      return;
    }
    let shortestPath = findShortestPaths(fromTIds, toTIds)
    voronoiLinks.set(getLinkId(l), shortestPath)
  })
  console.timeEnd('Shortest paths')
  return voronoiLinks

}

function getLinkId (l) {
  return '' + l.fromId + ';' + l.toId
}
