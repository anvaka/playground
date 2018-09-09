export const EPS = 0.0001;

export function isInterior(segment, point) {
  var pdx = point.x - segment.start.x;
  var pdy = point.y - segment.start.y;

  var dx = segment.end.x - segment.start.x;
  var dy = segment.end.y - segment.start.y;

  // cross product
  if (Math.abs(dy * pdx - dx * pdy) > EPS) {
    return false;
  }
  var dotProduct = pdx * dx + dy * pdy;
  if (dotProduct < 0) return false;

  var squaredlengthba = dx * dx + dy * dy;
  if (dotProduct > squaredlengthba) return false;

  return true;
}

export function samePoint(a, b) {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
}

export function getIntersectionXPoint(segment, xPos, yPos) {
  var dy1 = yPos - segment.start.y;
  if (Math.abs(dy1) < EPS) {
    if (xPos < segment.start.x) return segment.start.x;
    if (xPos > segment.end.x) return segment.end.x;
    return xPos;
    // if (xPos > segment.start.x) return segment.end.x;
    return segment.start.x;
    // return xPos + 0.0001;
    // return Number.MAX_SAFE_INTEGER;
    //return segment.start.x;
    // return segment.end.x;
  }

  var dx = segment.end.x - segment.start.x;
  var dy = segment.end.y - segment.start.y;
  
  if (Math.abs(dy) < EPS) {
    if (xPos < segment.start.x) return segment.start.x;
    if (xPos > segment.end.x) return segment.end.x;
    return xPos;
    // if (xPos > segment.start.x) return segment.end.x;
    // return segment.start.x;
    return segment.start.x;
    // return segment.start.x; // This?
    // return Number.MAX_SAFE_INTEGER;
    //throw new Error('horizontal segment that does not intersect');
    // return segment.end.x; // This?
  }

  var xOffset = dx * dy1 / dy;
  return Math.round((segment.start.x + xOffset) * 10000000)/10000000;
}

export function intersectBelowP(a, b, p) {
  //  https://stackoverflow.com/a/1968345/125351
  var aStart = a.start, aEnd = a.end, bStart = b.start, bEnd = b.end;
  var p0_x = aStart.x, p0_y = aStart.y,
      p1_x = aEnd.x, p1_y = aEnd.y,
      p2_x = bStart.x, p2_y = bStart.y,
      p3_x = bEnd.x, p3_y = bEnd.y;

  var s1_x, s1_y, s2_x, s2_y;
  s1_x = p1_x - p0_x; s1_y = p1_y - p0_y;
  s2_x = p3_x - p2_x; s2_y = p3_y - p2_y;

  var s, t;
  s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    var xValue = p0_x + (t * s1_x);
    var yValue = p0_y + (t * s1_y);

    // if (yValue < p.y || ((Math.abs(yValue - p.y) < EPS) && p.x < xValue)) {
      // Collision detected
      // if (
      //   same(xValue, p0_x, yValue, p0_y) ||
      //   same(xValue, p1_x, yValue, p1_y) ||
      //   same(xValue, p2_x, yValue, p2_y) ||
      //   same(xValue, p3_x, yValue, p3_y)) return;

      return {
        x: xValue,
        y: yValue
      }
    // }
  }
}

export function same(x0, x1, y0, y1) {
  return Math.abs(x0 - x1) < EPS && Math.abs(y0 - y1) < EPS;
}