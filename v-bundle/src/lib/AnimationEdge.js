const smoothPath = require('./link-renderer/smoothPath')
const sivg = require('simplesvg');
const isSamePoint = require('./link-renderer/isSamePoint');

let pathId = 0;

class AnimatedPoint {
  constructor({src, dst}) {
    this.src = src;
    this.dst = dst;
    this.diff = {
      x: dst.x - src.x,
      y: dst.y - src.y,
    }
    this.start = {
      x: src.x,
      y: src.y
    }
  }

  step(t) {
    this.src.x = this.diff.x * t + this.start.x
    this.src.y = this.diff.y * t + this.start.y
  }
}

class AnimatedPath {
  constructor(points, scene, ctx) {
    this.points = points;
    this.pathId = pathId++;
    this.ctx = ctx;
    this.path = sivg('path', {
      stroke: 'RGBA(184, 76, 40, 0.8)',
      'stroke-width': '1',
      d: this.getPath().toSVG(),
       fill:'transparent'
    });
    // scene.appendChild(this.path);
  }

  refresh() {
    // this.path.attr('d', this.getPath().toSVG())
    let ctx = this.ctx;
    let path = this.getPath();

    ctx.beginPath();
    path.onCanvas(ctx);
    ctx.stroke();
  }

  getPath() {
    return smoothPath(this.points.map(x => x.src)); 
  }

  step(t) {
    this.points.forEach(p => p.step(t));
    this.refresh();
  }
}

class AnimationEdge {
  constructor(edgePosition, parts, scene, ctx) {
    if (!isSamePoint(edgePosition.from, parts[0].from)) {
      // TODO: make the same direction.
      // let t = {
      //   x: edgePosition.from.x,
      //   y: edgePosition.from.y,
      // }
      // edgePosition.from = edgePosition.to;
      // edgePosition.to = t;
    }
    this.edgePosition = edgePosition;
    this.allRouteParts = parts;
    let subParts = splitInChunks(edgePosition.from, edgePosition.to, parts.length)
    // each part has its own width and is represented as individual path element
    let paths = [];
    parts.forEach((part, index) => {
      let pointsToAnimate = [];
      let subPart = subParts[index];
      let subPoints = splitInPoints(subPart.from, subPart.to, part.points.length);
      for(let i = 0; i < subPoints.length; ++i) {
        pointsToAnimate.push(new AnimatedPoint({
          src: subPoints[i],
          dst: part.points[i]
        }));
      }
      let animatedPath = new AnimatedPath(pointsToAnimate, scene, ctx);
      paths.push(animatedPath);
    })
    this.paths = paths;
    this.ctx = ctx;
  }

  step(t) {
    this.paths.forEach(p => p.step(t));
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