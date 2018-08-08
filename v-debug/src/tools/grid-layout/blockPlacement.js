var rbush = require('rbush');

var searchRadius = 20;

export default function createBlockPlacement(edges) {
  var tree = rbush();
  tree.load(edges);

  return {
    place: place
  }

  function place(node, pos) {
    var candidate;
    var mul = 1;
    var reducer = 1;
    do {
      var snapCandidates = tree.search({
        minX: pos[0] - searchRadius * mul,
        minY: pos[1] - searchRadius * mul,
        maxX: pos[0] + searchRadius * mul,
        maxY: pos[1] + searchRadius * mul
      });
      var candidate = occupyBestCandidate(snapCandidates, node, pos, 1./reducer)
      if (!candidate) {
        mul += 1;
        reducer += 1;
        console.error('Increase radius? Cannot snap ', pos)
      }
    } while (!candidate)
  }

  function occupyBestCandidate(rectangles, root, rootPos, rReducer) {
    if (!rectangles) return;
    if (root.size === undefined) throw new Error('Size is required for best placement');

    rectangles.sort((a, b) => {
      var bDist = getWeightedDistanceTo(b);
      var aDist = getWeightedDistanceTo(a);

      return b.line.length/(bDist) - a.line.length/(aDist);
    });

    function getWeightedDistanceTo(r) {
      var mx = (r.line.minX + r.line.maxX)/2;
      var my = (r.line.minY + r.line.maxY)/2;
      var dx = rootPos[0] - mx;
      var dy = rootPos[1] - my;
      return Math.sqrt(dx * dx + dy * dy) + 0.0001;
    }

    for (var i = 0; i < rectangles.length; ++i) {
      var r = rectangles[i];
      var line = r.line;

      if (line.isBlock) continue; // we are intersecting a building. Clearly cannot place here
      if (line.left && line.right) continue; // Both sides are taken already.
      //if (line.length < blockRadius*2) continue; // too small

      var radius = root.size * rReducer/2;

      var l = line.length;
      var tx = (line.maxX - line.minX)/l;
      var ty = (line.maxY - line.minY)/l;
      var offset = Math.random() - 0.5;
      var mx = (line.minX + line.maxX)/2 + tx * offset * l * 0.4;
      var my = (line.minY + line.maxY)/2 + ty * offset * l * 0.4;
      var nx = -ty * (root.size/2 + 2 + line.width), ny = tx * (root.size/2 + 2 + line.width);
      var angle = Math.atan2(ty, tx);
      var x, y;
      var side;

      var leftFree = !line.left;
      var rightFree = !line.right;
      while(leftFree || rightFree) {
        if (leftFree) {
          x = mx + nx, y = my + ny;
          side = 'left';
          leftFree = false;
        } else if (rightFree) {
          x = mx - nx, y = my - ny;
          side = 'right';
          rightFree = false;
        }

        var center = {x: x, y: y};
        var candidate = {
          node: root,
          angle: angle,
          center: center,
          leftTop: rotate({x: x - radius, y: y - radius}, center, angle),
          leftBottom: rotate({x: x - radius, y: y + radius}, center, angle),
          topRight: rotate({x: x + radius,y: y - radius}, center, angle),
          bottomRight: rotate({x: x + radius ,y: y + radius}, center, angle)
        }

        if (intersectSomething(candidate)) {
          //line[side] = { taken: true }
        } else {
          line[side] = candidate;
          root.pos = line[side];
          markAsTakenByBlock(candidate)
          return line;
        }
      }
    }
  }

  function intersectSomething(candidate) {
    var potentialIntersections = tree.search(getBBox(candidate));
    for (var i = 0; i < potentialIntersections.length; ++i) {
      var bbox = potentialIntersections[i];
      if (bboxIntersectsRects(bbox, candidate)) return true;
    }

    return false;
  }

  function markAsTakenByBlock(candidate) {
    tree.load([
      makeLineBBox(candidate.leftTop, candidate.topRight),
      makeLineBBox(candidate.topRight, candidate.bottomRight),
      makeLineBBox(candidate.bottomRight, candidate.leftBottom),
      makeLineBBox(candidate.leftBottom, candidate.leftTop)
    ]);
  }

  function makeLineBBox(a, b) {
    return {
      line: {isBlock: true},
      minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y),
      maxX: Math.max(b.x, a.x), maxY: Math.max(b.y, a.y)
    };
  }

  function bboxIntersectsRects(bbox, candidateRect) {
    var p = { x: bbox.minX, y: bbox.minY };
    var q = { x: bbox.maxX, y: bbox.maxY };

    return segmentIntersects(p, q, candidateRect.leftTop, candidateRect.topRight) ||
           segmentIntersects(p, q, candidateRect.topRight, candidateRect.bottomRight) ||
           segmentIntersects(p, q, candidateRect.bottomRight, candidateRect.leftBottom) ||
           segmentIntersects(p, q, candidateRect.leftBottom, candidateRect.leftTop) ||
           pointInRectangle(p, candidateRect) ||
           pointInRectangle(q, candidateRect)
  }

  function pointInRectangle(m, r) {
    var AB = vectorDiff(r.leftTop, r.topRight);
    var AM = vectorDiff(r.leftTop, m);
    var BC = vectorDiff(r.topRight, r.bottomRight);
    var BM = vectorDiff(r.topRight, m);
    var dotABAM = dot(AB, AM);
    var dotABAB = dot(AB, AB);
    var dotBCBM = dot(BC, BM);
    var dotBCBC = dot(BC, BC);
    return 0 <= dotABAM && dotABAM <= dotABAB && 0 <= dotBCBM && dotBCBM <= dotBCBC;
  }

  function vectorDiff(p1, p2) {
    return {
      x: (p2.x - p1.x),
      y: (p2.y - p1.y)
    };
  }

  function dot(u, v) {
      return u.x * v.x + u.y * v.y; 
  } 

  function getBBox(candidate) {
    var minX = Number.POSITIVE_INFINITY; var maxX = Number.NEGATIVE_INFINITY;
    var minY = Number.POSITIVE_INFINITY; var maxY = Number.NEGATIVE_INFINITY;
    if (candidate.leftTop.x < minX) minX = candidate.leftTop.x; if (candidate.leftTop.y < minY) minY = candidate.leftTop.y;
    if (candidate.leftTop.x > maxX) maxX = candidate.leftTop.x; if (candidate.leftTop.y > maxY) maxY = candidate.leftTop.y;

    if (candidate.topRight.x < minX) minX = candidate.topRight.x; if (candidate.topRight.y < minY) minY = candidate.topRight.y;
    if (candidate.topRight.x > maxX) maxX = candidate.topRight.x; if (candidate.topRight.y > maxY) maxY = candidate.topRight.y;

    if (candidate.leftBottom.x < minX) minX = candidate.leftBottom.x; if (candidate.leftBottom.y < minY) minY = candidate.leftBottom.y;
    if (candidate.leftBottom.x > maxX) maxX = candidate.leftBottom.x; if (candidate.leftBottom.y > maxY) maxY = candidate.leftBottom.y;

    if (candidate.bottomRight.x < minX) minX = candidate.bottomRight.x; if (candidate.bottomRight.y < minY) minY = candidate.bottomRight.y;
    if (candidate.bottomRight.x > maxX) maxX = candidate.bottomRight.x; if (candidate.bottomRight.y > maxY) maxY = candidate.bottomRight.y;

    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  /**
   * Rotate point p around center c by angle
   */
  function rotate(p, c, angle) {
    return {
      x: (p.x - c.x) * Math.cos(angle) - (p.y - c.y) * Math.sin(angle) + c.x,
      y: (p.x - c.x) * Math.sin(angle) + (p.y - c.y) * Math.cos(angle) + c.y,
    }
  }
}

// returns true if line segment 'p1q1' // and 'p2q2' intersect
function segmentIntersects(p1, q1, p2, q2) {
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

  return (val > 0) ? 1: 2; // clock or counter clockwise
}
