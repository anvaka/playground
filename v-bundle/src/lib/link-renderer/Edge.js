const smoothPath = require('./smoothPath.js');
const addNoise = require('./addNoise.js');
const pointXY = require('./pointXY.js')

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

module.exports = Edge;