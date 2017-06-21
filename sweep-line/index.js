const Point = require('./Point.js');

/*
 * checks if interval [a, b] intersects interval [c, d]
 */
function doIntersect(p1, q1, p2, q2) {
  // Find the four orientations needed for general and
  // special cases
  let o1 = orientation(p1, q1, p2);
  let o2 = orientation(p1, q1, q2);
  let o3 = orientation(p2, q2, p1);
  let o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases
  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;

  // p1, q1 and p2 are colinear and q2 lies on segment p1q1
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;

    // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false; // Doesn't fall in any of the above cases
}

function onSegment(p, q, r) {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}
/**
 * Finds orientation of an ordered triplet.
 * 
 * @returns
 * + 0 if p1, p2, p3  are colinear
 * + 1 if they are oriented clockwise
 * + 2 if they are oriented counter clockwise
 */
function orientation(p1, p2, p3) {
  let val = (p2.y - p1.y) * (p3.x - p2.x) -
            (p2.x - p1.x) * (p3.y - p2.y);

  if (val == 0) return 0;  // colinear

  return (val > 0) ? 1: 2; // clock or counterclock wise
}


const p1 = new Point(0, 5);
const q1 = new Point(10, 0);
const p2 = new Point(1, 1);
const q2 = new Point(10, 10);

console.log(doIntersect(p1, q1, p2, q2));
