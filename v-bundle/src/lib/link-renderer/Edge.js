const smoothPath = require('./smoothPath.js');
const addNoise = require('./addNoise.js');
const getLength = require('./length');

class Edge {
  constructor(from, to, seenCount) {
    this.from = from;
    this.to = to;
    this.seenCount = seenCount;
    this.width = 1;
    this.points = getPoints(from, to, /* noisy = */ true);
  }

  getWidth() {
    return this.width;
  }

  getPath() {
    return smoothPath(this.points);
  }
}

module.exports = Edge;

function getPoints(from, to, noisy) {
  let points = []
  if (noisy) {
    const variance = getLength(from, to) * 0.2
    addNoise(from.x, from.y, to.x, to.y, variance, 4, points)
  } else {
    points.push(from, to);
  }

  return points;
}