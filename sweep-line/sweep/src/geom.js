export const EPS = 1e-10;

export function getIntersectionXPoint(segment, xPos, yPos) {
  var dy1 = segment.from.y - yPos;
  var dy2 = yPos - segment.to.y;
  var dy = segment.to.y - segment.from.y;
  if (Math.abs(dy1) < EPS) {
    // The segment starts on the sweepline
    if (Math.abs(dy) < EPS) {
      // the segment is horizontal. Intersection is at the point
      if (xPos <= segment.from.x) return segment.from.x;
      if (xPos > segment.to.x) return segment.to.x;
      return xPos;
    }
    return segment.from.x;
  }
  
  var dx = (segment.to.x - segment.from.x); 
  var xOffset; 
  if (dy1 >= dy2) {
    xOffset = dy1 * (dx / dy); 
    return (segment.from.x - xOffset);
  } 
  xOffset = dy2 * (dx / dy);
  return (segment.to.x + xOffset);
}

export function intersectSegments(a, b) {
  //  https://stackoverflow.com/a/1968345/125351
  var aStart = a.from, aEnd = a.to, bStart = b.from, bEnd = b.to;
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
    return {
      x: p0_x + (t * s1_x),
      y: p0_y + (t * s1_y)
    }
  }
}

export function same(x0, x1, y0, y1) {
  return Math.abs(x0 - x1) < EPS && Math.abs(y0 - y1) < EPS;
}

export function samePoint(a, b) {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
}
