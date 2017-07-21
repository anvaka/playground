const pointXY = require('./pointXY.js');
const Edge = require('./Edge');

module.exports = linkRenderer;

function linkRenderer() {
  let links = new Map();
  let maxSeenCount = 0;
  let bucketsCount = 4;

  return {
    reset,
    draw,
    getRoutes,
    forEachEdge,
  };

  function forEachEdge(cb) {
    links.forEach(link => {
      const size = Math.round((link.seenCount / maxSeenCount) * bucketsCount) + 1;
      cb(new Edge(link.from, link.to, size));
    });
  }

  function reset() {
    maxSeenCount = 0;
    links = new Map();
  }

  function draw(from, to) {
    let key = getEdgeKey(from, to);
    let value = links.get(key);
    if (!value) {
      value = { from, to, seenCount: 0 }
      links.set(key, value)
    }
    value.seenCount += 1;
    if (value.seenCount > maxSeenCount) maxSeenCount = value.seenCount;

    return key;
  }

  function getRoutes() {
    let routes = [];
    forEachEdge(edge => { routes.push(edge); })
    return routes;
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