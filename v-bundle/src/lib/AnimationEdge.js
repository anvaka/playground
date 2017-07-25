const smoothPath = require('./link-renderer/smoothPath')
var animate = require('amator')

class AnimatedPoint {
  constructor({src, dst}) {
    this.src = src;
    this.dst = dst;
    animate(this.src, this.dst);
  }

  getPath() {
    return this.src.x + ',' + this.src.y
  }
}

class AnimatedPath {
  constructor(points) {
    this.points = points;
  }
  getPath() {
    return 'M' + this.points.map(p => p.getPath()).join(' '); 
    // return smoothPath(this.points.map(x => x.src)); // 'M' + this.points.map(p => p.getPath()).join(' '); 
  }
}

class AnimationEdge {
  constructor(edgePosition, parts) {
    this.edgePosition = edgePosition;
    this.allRouteParts = parts;
    let subParts = splitInChunks(edgePosition.from, edgePosition.to, parts.length)
    // each part has its own width and is represented as individual path element
    let paths = [];
    parts.forEach((part, index) => {
      let subPart = subParts[index];
      let pointsToAnimate = [];
      let subPoints = splitInPoints(subPart.from, subPart.to, part.points.length);
      for(let i = 0; i < subPoints.length; ++i) {
        pointsToAnimate.push(new AnimatedPoint({
          src: subPoints[i],
          dst: part.points[i]
        }));
      }
      let animatedPath = new AnimatedPath(pointsToAnimate);
      paths.push(animatedPath);
    })
    this.paths = paths;
  }

  getPaths() {
    return this.paths;
  }

  step(t) {
    this.paths.forEach(path => {
      path.forEach(p => {
        p.src.x += 0.1;
      })
    })
  }
}

function splitInPoints(fromOriginal, toOriginal, chunksCount) {
  let dx = (toOriginal.x - fromOriginal.x)
  let dy = (toOriginal.y - fromOriginal.y)
  let nx = dx/(chunksCount - 1); // -1 to include borders
  let ny = dy/(chunksCount - 1);

  let points = [];
  for (let i = 0; i < chunksCount; ++i) {
    points.push({
      x: fromOriginal.x + i * nx,
      y: fromOriginal.y + i * ny
    })
  }

  return points;
}

function splitInChunks(fromOriginal, toOriginal, chunksCount) {
  let chunks = [];
  let from = {
    x: fromOriginal.x,
    y: fromOriginal.y
  };
  let dx = (toOriginal.x - fromOriginal.x)
  let dy = (toOriginal.y - fromOriginal.y)
  let nx = dx/chunksCount;
  let ny = dy/chunksCount;
  let to;

  for (let i = 0; i < chunksCount; ++i) {
    to = {
      x: from.x + nx,
      y: from.y + ny
    }
    chunks.push({ from, to });

    from = {
      x: to.x,
      y: to.y
    }
  }
  return chunks;
}

module.exports = AnimationEdge;