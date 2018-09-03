import {getIntersectionXPoint, EPS, samePoint, isInterior} from './geom'

export default function createSweepStatus() {
  var status = [];
  var stamp = 0;

  return {
    findSegmentsThatContain: findSegmentsThatContain,
    deleteSegments,
    insertSegments,
    getLeftRight,
    getLeftMostSegment,
    getRightMostSegment
  }

  function getLeftMostSegment(segments, p) {
    var collection = segments.map(x => status.indexOf(x)).filter(x => x > -1);
    var idx = collection[0]
    if (idx !== undefined) {
      var segment = status[idx];
      var x = getIntersectionXPoint(segment, p.y);

      return {
        segment,
        x
      };
    }
  }

  function getRightMostSegment(segments, p) {
    var collection = segments.map(x => status.indexOf(x)).filter(x => x > -1);
    var idx = collection[collection.length - 1]
    if (idx !== undefined) {
      var segment = status[idx];
      var x = getIntersectionXPoint(segment, p.y);
      return {
        segment,
        x
      };
    }
  }

  function getLeftRight(point) {
    var left = null, right = null;

    for (var i = 0; i < status.length; ++i) {
      var current = status[i];
      // TODO: likely wrong
      var xPt = getIntersectionXPoint(current, point.y);
      if (Math.abs(xPt - point.x) < EPS) {
        if (!left) left = current;
        else if (!right) {
          right = current;
          break;
        }
      } else if (xPt < point.x) {
        left = current;
      } else if (xPt > point.x) {
        right = current;
        break;
      }
    }

    return {left: left, right: right};
  }

  function insertSegments(segments, sweepLinePos) {
    if (!segments) return;

    segments.forEach(insertOneSegment);
    status.sort(byX)

    function byX(a, b) {
      var ax = getIntersectionXPoint(a, sweepLinePos.y)
      var bx = getIntersectionXPoint(b, sweepLinePos.y)
      if (Math.abs(ax - bx) < EPS) {
        // those that added later should come first
        return a.stamp - b.stamp;
      }
      return ax - bx;
    }
  }

  function deleteSegments(segments) {
    if (segments) segments.forEach(removeOneSegment);
  }

  function removeOneSegment(s) {
    var idxToRemove = status.indexOf(s);
    if (idxToRemove > -1) {
      status.splice(idxToRemove, 1);
    }
  }

  function insertOneSegment(s) {
    stamp += 1;
    s.stamp = stamp;

    status.push(s) 
  }

  function findSegmentsThatContain(p) {
    var lower = [];
    var interior = [];
    for (var i = 0; i < status.length; ++i) {
      var current = status[i];
      if (samePoint(current.end, p)) {
        lower.push(current)
      } else if (isInterior(current, p)) {
        interior.push(current)
      }
    }

    return {
      lower: lower,
      interior: interior
    }
  }
}

// function getLeftMostSegment(segmentList, p) {
//   var min = Number.POSITIVE_INFINITY;
//   var segment = null;
//   for (var i = 0; i < segmentList.length; ++i) {
//     var current = segmentList[i];
//     if (current)
//     var xIntersect = getIntersectionXPoint(current, p.y);
//     if (xIntersect < min) {
//       min = xIntersect;
//       segment = current;
//     }
//   }

//   return {
//     segment: segment,
//     x: min
//   };
// }

// function getRightMostSegment(segmentList, p) {
//   var max = Number.NEGATIVE_INFINITY;
//   var segment = null;
//   for (var i = 0; i < segmentList.length; ++i) {
//     var current = segmentList[i];
//     var xIntersect = getIntersectionXPoint(current, p.y);
//     if (xIntersect > max) {
//       max = xIntersect;
//       segment = current;
//     }
//   }

//   return {
//     segment: segment,
//     x: max
//   }
// }
