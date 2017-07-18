module.exports = linkRenderer;

class Edge {
  constructor(from, to, width) {
    this.from = from;
    this.to = to;
    this.width = width;
  }
  getWidth() {
    return this.width;
  }
  getPath() {
    return 'M' + pointXY(this.from) + 'L' + pointXY(this.to);
  }
}

function linkRenderer() {
  let links = new Map();
  let maxSeenCount = 0;
  let bucketsCount = 4;

  return {
    reset,
    draw,
    getRoutes
  };

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
  }

  function getRoutes() {
    let routes = [];
    links.forEach(link => {
      const size = Math.round((link.seenCount / maxSeenCount) * bucketsCount) + 1;
      routes.push(new Edge(link.from, link.to, size));
    });
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
  function pointXY(p) {
    return p.x + ',' + p.y
  }
