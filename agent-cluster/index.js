import ngraphRandom from 'ngraph.random';

export default function clusterGraph(graph, randomWalkLength = 10, randomWalkCount = 100) {
  let edgeWeights = new Map();
  let totalWalks = 0;
  const random = ngraphRandom(42);

  graph.forEachNode(randomWalk);
  let stats = normalizeEdgeWeights();
  // now we need to build clusters, but traversing the graph again
  // but this time we will use the edge weights to determine if we should
  // follow an edge or not (if weight is too low, we will not follow it)
  let clusters = getClustersFromWeights(stats);

  return clusters;

  function getClustersFromWeights(stats) {
    let clusters = [];
    let visited = new Set();

    graph.forEachNode(node => {
      if (!visited.has(node.id)) {
        let cluster = [];
        clusters.push(cluster);
        traverse(node, cluster, stats);
      }
    });

    return clusters;

    function traverse(node, cluster, stats) {
      cluster.push(node.id);
      visited.add(node.id);
      
      let links = [...node.links];
      if (!links.length) {
        return;
      }

      for (let edge of links) {
        let neighborId = edge.fromId === node.id ? edge.toId : edge.fromId;
        if (!visited.has(neighborId)) {
          let weight = edgeWeights.get(edge) || 0;
          if (weight >= stats.avgWeight + 0* stats.stdDeviation) {
            let neighbor = graph.getNode(neighborId);
            traverse(neighbor, cluster, stats);
          }
        }
      }
    }
  }

  function normalizeEdgeWeights() {
    let weights = [];
    edgeWeights.forEach((weight, edge) => {
      const normalizedWeight = weight / totalWalks;
      edgeWeights.set(edge, normalizedWeight);
      weights.push(normalizedWeight);
    });

    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    let stdDeviation = 0;
    for (let weight of weights) {
      stdDeviation += Math.pow(weight - avgWeight, 2);
    }
    stdDeviation = Math.sqrt(stdDeviation / weights.length);
    return { avgWeight, stdDeviation }
  }

  function randomWalk(fromNode) {
    for (let i = 0; i < randomWalkCount; ++i) {
      let currentNode = fromNode.id;

      for (let i = 0; i < randomWalkLength; ++i) {
        const edge = pickRandomNeighbor(currentNode);
        if (edge !== undefined) {
          totalWalks++;
          const weight = edgeWeights.get(edge) || 0;
          edgeWeights.set(edge, weight + 1);
          if (edge.fromId === currentNode) {
            currentNode = edge.toId;
          } else {
            currentNode = edge.fromId;
          }
        } else {
          break;
        }
      }
    }
  }

  function pickRandomNeighbor(nodeId) {
    let node = graph.getNode(nodeId);
    const neighbors = [...node.links];
    if (neighbors.length) {
      const randomIndex = Math.floor(random.nextDouble() * neighbors.length);
      let edge = neighbors[randomIndex];
      return edge;
    }
  }
}