module.exports = smoothPath;

let isSamePoint = require('./isSamePoint');

class MoveTo {
  constructor(pt) {
    assertNumber(pt.x, pt.y)
    this.x = pt.x;
    this.y = pt.y;
  }
  onCanvas(ctx) {
    ctx.moveTo(this.x, this.y);
  }
  toSVG() {
    return 'M' + this.x + ',' + this.y;
  }
}

class LineTo {
  constructor(pt) {
    assertNumber(pt.x, pt.y)
    this.x = pt.x;
    this.y = pt.y;
  }
  onCanvas(ctx) {
    ctx.lineTo(this.x, this.y);
  }
  toSVG() {
    return 'L' + this.x + ',' + this.y;
  }
}

class BezierCurveTo {
  constructor(cp1, cp2, end) {
    assertNumber(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y)

    this.cp1x = cp1.x;
    this.cp1y = cp1.y;
    this.cp2x = cp2.x;
    this.cp2y = cp2.y;
    this.x = end.x;
    this.y = end.y;
  }

  toSVG() {
    return 'C' + this.cp1x + ',' + this.cp1y + ' ' +
           this.cp2x + ',' + this.cp2y + ' ' +
           this.x + ',' + this.y;
  }

  onCanvas(ctx) {
    ctx.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.x, this.y);
  }
}

class Path {
  constructor() {
    this.instructions = [];
  }

  add(instruction) {
    this.instructions.push(instruction)
  }
  onCanvas(ctx) {
    this.instructions.forEach(i => i.onCanvas(ctx));
  }
  toSVG() {
    let path = this.instructions.reduce((path, instruction) => path + instruction.toSVG() , '');
    return path;
  }
}

function smoothPath(path) {
  let prevSegment = segment(path[0], path[1]);
  let svg_path = new Path();
  svg_path.add(new MoveTo(path[0]))
  let splitRatio = 0.55

  for (var i = 1; i < path.length - 1; i++) {
    let prevSplit = splitSegment(prevSegment, splitRatio)
    svg_path.add(new LineTo(prevSplit[1])); 

    if (isSamePoint(path[i], path[i + 1])) continue;

    let nextSegment = segment(path[i], path[i + 1])
    let lastControlPointSegment = segment(prevSplit[1], prevSplit[2])
    let lastControlPointSplit = splitSegment(lastControlPointSegment, 0.5)

    let nextSplit = splitSegment(nextSegment, 1 - splitRatio)
    let nextControlPointSegment = segment(nextSplit[0], nextSplit[1]);
    let nextControlPointSplit = splitSegment(nextControlPointSegment, 0.5)

    svg_path.add(
      new BezierCurveTo(lastControlPointSplit[1], nextControlPointSplit[1], nextControlPointSplit[2])
    );

    prevSegment = nextSegment
  }

  if (path.length > 1) svg_path.add(new LineTo(path[path.length - 1]))

  return svg_path;

  function segment(from, to) {
    return {
      from: from,
      to: to
    }
  }

  function splitSegment(segment, ratio) {
    var dx = segment.to.x - segment.from.x
    var dy = segment.to.y - segment.from.y

    var length = Math.sqrt(dx * dx + dy * dy)
    var ux = dx / length;
    var uy = dy / length;
    var step = length * ratio;

    var points = [{
      x: segment.from.x,
      y: segment.from.y
    }, {
      x: segment.from.x + ux * step,
      y: segment.from.y + uy * step
    }, {
      x: segment.to.x,
      y: segment.to.y
    }]

    return points
  }
}

function assertNumber(...params) {
  params.forEach(x => {
    if (Number.isNaN(x)) throw new Error('Nan')
  })
}