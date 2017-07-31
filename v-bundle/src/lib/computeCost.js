module.exports = computeCost;
let getDistanceMap = require('./allShortestPaths')

function computeCost(graph, linkRenderer, bundledGraph) {
  let unbundledDistance = 0;
  let boundv2 = 0;

  graph.forEachLink(l => {
    let from = graph.getNode(l.fromId).data;
    let to = graph.getNode(l.toId).data;

    unbundledDistance += getLength(from, to);
    boundv2 += bundledGraph.getLink(l.fromId, l.toId).data
  });
  // Compute all shortest paths in the original graph, and
  // then compute all shortest paths in the bundled graph.

  // compute average/median path length for each node
  // compute average/median path length for the entire graph
  let originalGraphDistance = getDistanceMap(graph, (a, b) => {
    return getLength(graph.getNode(a).data, graph.getNode(b).data);
  });
  let bundledlGraphDistance = getDistanceMap(bundledGraph, (a, b) => {
    let link = bundledGraph.getLink(a, b) || bundledGraph.getLink(b, a);
    return link.data;
  });

  let srcStats = getDistanceStats(originalGraphDistance);
  let bundledStats = getDistanceStats(bundledlGraphDistance);
  printStats({
    original: srcStats,
    bundled: bundledStats,
  });

  let routedLength = 0;
  linkRenderer.forEachEdge(edge => {
    routedLength += getLength(edge.from, edge.to);
  })

  return {
    unbundledDistance,
    routedLength,
    boundv2
  };
}

function getLength(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function printStats(statistics) {
  console.log(statistics);
}

function getDistanceStats(distanceMap) {
  let totalDistance = []
  let nodeStats = new Map(); // maps from node id, to node distance stats
  distanceMap.forEach((dist, srcId) => {
    let nodeDistance = [];
    dist.forEach((otherNodeDistance, dstId) => {
      if (dstId === srcId) return;
      totalDistance.push(otherNodeDistance);
      nodeDistance.push(otherNodeDistance);
    })

    nodeStats.set(srcId, getArrayStatistics(nodeDistance))
  })

  return {
    nodeStats,
    graphStats: getArrayStatistics(totalDistance)
  }
}

function getArrayStatistics(distancesArray) {
  let sum = 0;
  distancesArray.sort(ascending)
  distancesArray.forEach(dist => {
    sum += dist;
  });

  let avg =  sum / distancesArray.length;
  let median = percentile(distancesArray, 0.5)
  let p90 = percentile(distancesArray, 0.9);

  return {
    avg, median, p90
  }
}

function percentile(sortedArray, offset) {
  let idx = Math.floor(sortedArray.length * offset);
  return sortedArray[idx];
}

function ascending(x, y) {
  return x - y;
}