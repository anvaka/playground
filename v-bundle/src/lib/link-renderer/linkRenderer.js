const pointXY = require('./pointXY.js');
const Edge = require('./Edge');

module.exports = linkRenderer;

function linkRenderer() {
  // Multiple edges can start and end at the same position. This map 
  // serves for edges de-duping and aggregation.
  let edges = new Map();

  // How many times a given "from"/"to" pair was seen. Serves to determine
  // edge thickness (aka edge's bucket)
  let maxSeenCount = 0;

  // If the same edge is used multiple times it is promoted to higher "bucket".
  // Buckets are used for edge width/thickness. You can think about this as
  // a historgram
  let bucketsCount = 4;

  return {
    reset,
    addEdge,
    getRoutes,
    forEachEdge,
    updateWidths,
  };

  function updateWidths() {
    forEachEdge(edge => {
      edge.width = Math.round((edge.seenCount / maxSeenCount) * bucketsCount) + 1;
    });
  }

  function forEachEdge(cb) { edges.forEach(cb); }

  function getRoutes() { return Array.from(edges.values()); }

  function reset() {
    maxSeenCount = 0;
    edges = new Map();
  }

  function addEdge(from, to) {
    let key = getEdgeKey(from, to);
    let edge = edges.get(key);
    if (!edge) {
      edge = new Edge(from, to, 0);
      edges.set(key, edge)
    }
    edge.seenCount += 1;
    if (edge.seenCount > maxSeenCount) maxSeenCount = edge.seenCount;

    return edge;
  }

  function getEdgeKey(from, to) {
    let fromId = pointXY(from);
    let toId = pointXY(to);

    if (fromId < toId) {
      let t = fromId;
      fromId = toId;
      toId = t;
    }

    return fromId + '_' + toId;
  }
}