module.exports = linkRenderer;

const random = require('ngraph.random').random(42)
const smoothPath = require('./smoothPath.js');

class Edge {
  constructor(from, to, width) {
    this.from = from;
    this.to = to;
    this.width = width;
    this.noisy = true;
  }
  getWidth() {
    return this.width;
  }
  getPath() {
    if (this.noisy) {
      let dx = this.from.x - this.to.x
      let dy = this.from.y - this.to.y
      let l = Math.sqrt(dx * dx + dy * dy)
      const variance = l * 0.2
      let points = []
      addNoise(this.from.x, this.from.y, this.to.x, this.to.y, variance, 4, points)
      // return 'M' + pointXY(points[0]) + points.slice(1).map(p => 'L' + pointXY(p));
      return smoothPath(points); //'M' + pointXY(points[0]) + points.slice(1).map(p => 'L' + pointXY(p));
    }
    return 'M' + pointXY(this.from) + 'L' + pointXY(this.to);
  }
}

function uniform(min, max) {
  return random.nextDouble()* (max - min) + min;
  //return Math.random() * (max - min) + min;
}

function gaussian(mu, sigma) {
    // use the polar form of the Box-Muller transform
    let r, x, y;
    do {
        x = uniform(-1.0, 1.0);
        y = uniform(-1.0, 1.0);
        r = x*x + y*y;
    } while (r >= 1 || r === 0);
    return mu + sigma * x * Math.sqrt(-2 * Math.log(r) / r);

    // Remark:  y * Math.sqrt(-2 * Math.log(r) / r)
    // is an independent random gaussian
}

function addNoise(x0, y0, x1, y1, v, n, out) {
  let start = {
    x: x0,
    y: y0
  }
  let end = {
    x: x1,
    y: y1
  }

  let dx = x1 - x0
  let dy = y1 - y0
  let l = Math.sqrt(dx * dx + dy * dy)

  var variance = l * 0.5
  var xmid = 0.5 * (x0 + x1) + gaussian(0, Math.sqrt(variance));
  var ymid = 0.5 * (y0 + y1) + gaussian(0, Math.sqrt(variance));

  if (n > 1 && l > 15) {
    addNoise(x0, y0, xmid, ymid, v/2, n - 1, out)
    addNoise(xmid, ymid, x1, y1, v/2, n - 1, out)
  } else {
    out.push(start, {
      x: xmid,
      y: ymid
    }, end)
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
