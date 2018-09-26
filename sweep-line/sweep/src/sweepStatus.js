import SplayTree from 'splaytree';
import {samePoint, getIntersectionXPoint, EPS} from './geom'

/**
 * Creates a new sweep status data structure.
 */
export default function createSweepStatus(onError) {
  var lastPointY, prevY;
  var lastPointX, prevX;
  var useBelow = false;
  var status = new SplayTree(compareSegments);

  // To save on GC we return mutable object.
  var currentBoundary = {
    beforeLeft: null,
    left: null,
    right: null,
    afterRight: null,
  }

  var currentLeftRight = {left: null, right: null};

  return {
    /**
     * Add new segments into the status tree.
     */
    insertSegments,

    /**
     * Remove segments from the status tree.
     */
    deleteSegments,

    /**
     * Returns segments that are to the left and right from a given point.
     */
    getLeftRightPoint,

    /**
     * For a given collections of segments finds the most left and the most right
     * segments. Also returns segments immediately before left, and after right segments.
     */
    getBoundarySegments,

    /**
     * Current binary search tree with segments
     */
    status,

    /**
     * Introspection method that verifies if there are duplicates in the segment tree.
     * If there are - `onError()` is called.
     */
    checkDuplicate,

    /**
     * Prints current segments in order of their intersection with sweep line. Introspection method.
     */
    printStatus,

    /**
     * Returns current position of the sweep line.
     */
    getLastPoint() {
      return {x: lastPointX, y: lastPointY};
    }
  }

  function compareSegments(a, b) {
    if (a === b) return 0;

    var ak = getIntersectionXPoint(a, lastPointX, lastPointY);
    var bk = getIntersectionXPoint(b, lastPointX, lastPointY);

    var res = ak - bk;
    if (Math.abs(res) >= EPS) {
      // We are okay fine. Intersection distance between two segments
      // is good to give conclusive answer
      return res;
    }

    var aIsHorizontal = Math.abs(a.dy) < EPS;
    var bIsHorizontal = Math.abs(b.dy) < EPS;
    // TODO: What if both a and b is horizontal?
    // move horizontal to end
    if (aIsHorizontal) { 
      return useBelow ? -1 : 1;
    }

    if (bIsHorizontal) {
      if (useBelow) {
        return (b.from.x >= lastPointX) ? -1 : 1
      }
      return -1;
      // return useBelow ? 1 : -1;
    }
    var pa = a.angle;
    var pb = b.angle;
    if (Math.abs(pa - pb) >= EPS) {
      return useBelow ? pa - pb : pb - pa;
    }

    var segDist = a.from.y - b.from.y;
    if (Math.abs(segDist) >= EPS) {
      return -segDist;
    }
    segDist = a.to.y - b.to.y;
    if (Math.abs(segDist) >= EPS) {
      return -segDist;
    }
    return 0;
    debugger;

    // Could also use:
    // var aAngle = Math.atan2(a.from.y - a.to.y, a.from.x - a.to.x);
    // var bAngle = Math.atan2(b.from.y - b.to.y, b.from.x - b.to.x);
    // return useBelow ? bAngle - aAngle : aAngle - bAngle;
  }

  function getBoundarySegments(upper, interior) {
    var leftMost, rightMost, i;
    var uLength = upper.length;

    if (uLength > 0) {
      leftMost = rightMost = upper[0];
    } else {
      leftMost = rightMost = interior[0];
    }

    for (i = 1; i < uLength; ++i) {
      var s = upper[i];
      var cmp = compareSegments(leftMost, s);
      if (cmp > 0) leftMost = s;

      cmp = compareSegments(rightMost, s);
      if (cmp < 0) rightMost = s;
    }

    var startFrom = uLength > 0 ? 0 : 1;
    for (i = startFrom; i < interior.length; ++i) {
      s = interior[i];
      cmp = compareSegments(leftMost, s);
      if (cmp > 0) leftMost = s;

      cmp = compareSegments(rightMost, s);
      if (cmp < 0) rightMost = s;
    }

    // at this point we have our left/right segments in the status.
    // Let's find their prev/next elements and report them back:
    var left = status.find(leftMost);
    if (!left) {
      onError('Left is missing. Precision error?');
    }

    var right = status.find(rightMost);
    if (!right) {
      onError('Right is missing. Precision error?');
    }

    var beforeLeft = left && status.prev(left);
    var afterRight = right && status.next(right);

    currentBoundary.beforeLeft = beforeLeft && beforeLeft.key;
    currentBoundary.left = left && left.key;
    currentBoundary.right = right && right.key;
    currentBoundary.afterRight = afterRight && afterRight.key;

    return currentBoundary;
  }

  function getLeftRightPoint(p) {
    var lastLeft;
    var current = status._root;
    var minX = Number.POSITIVE_INFINITY;
    var useNext = false;
    while (current) {
      var x = getIntersectionXPoint(current.key, p.x, p.y);
      var dx = p.x - x;
      if (dx >= 0) {
        if (dx < minX) {
          minX = dx;
          lastLeft = current;
          current = current.left;
          useNext = false;
        } else {
          break;
        }
      } else {
        if (-dx < minX) {
          useNext = true;
          minX = -dx;
          lastLeft = current;
          current = current.right;
        } else {
          break;
        }
      }
    }
    if (useNext) {
      lastLeft = status.next(lastLeft);
    }

    currentLeftRight.left = lastLeft && lastLeft.key
    var next = lastLeft && status.next(lastLeft);
    currentLeftRight.right = next && next.key
    return currentLeftRight;

    // Haven't decided which method is faster yet.

    // var right, left,  x;
    // var all = status.keys()
    // for (var i = 0; i < all.length; ++i) {
    //   var segment = all[i];
    //   x = getIntersectionXPoint(segment, p.x, p.y);
    //   if (x > p.x && !right) {
    //     right = segment;
    //     break;
    //   } else if (x < p.x) {
    //     left = segment;
    //   }
    // }

    // currentLeftRight.left = left;
    // currentLeftRight.right = right;

    // return currentLeftRight;
  }

  function checkDuplicate() {
    var prev;
    status.forEach(node => {
      var current = node.key;

      if (prev) {
        if (samePoint(prev.from, current.from) && samePoint(prev.to, current.to)) {
          // Likely you have received error before during segment removal.
          onError('Duplicate key in the status! This may be caused by Floating Point rounding error')
        }
      }
      prev = current;
    });
  }

  function printStatus() {
    // eslint-disable-next-line
    console.log('status line: ', lastPointX, lastPointY);
    status.forEach(node => {
      var x = getIntersectionXPoint(node.key, lastPointX, lastPointY);
      // eslint-disable-next-line
      console.log(x + ' ' + node.key.name);
    })
  }

  function insertSegments(interior, upper, sweepLinePos) {
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;

    for (var i = 0; i < interior.length; ++i) {
      status.add(interior[i]);
    }
    for (i = 0; i < upper.length; ++i) {
      status.add(upper[i]);
    }
  }

  function deleteSegments(lower, interior, sweepLinePos) {
    // I spent most of the time debugging this method. Depending on the
    // algorithm state we can run into situation when dynamic keys of the
    // `status` tree predict wrong branch, and thus we are not able to find
    // the segment that needs to be deleted. If that happens I'm trying to
    // use previous point and repeat the process. This may result in 
    // incorrect state. In that case I report an error. 
    var i;
    var prevCount = status._size;
    prevX = lastPointX;
    prevY = lastPointY;
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;

    useBelow = true;
    for(i = 0; i < lower.length; ++i) {
      removeSegment(lower[i], sweepLinePos)
    }
    for(i = 0; i < interior.length; ++i) {
      removeSegment(interior[i], sweepLinePos)
    }
    useBelow = false;

    if (status._size !== prevCount - interior.length - lower.length) {
      // This can happen when rounding error occurs. You can try scaling your input
      onError('Segments were not removed from a tree properly. Precision error?');
    }
  }

  function removeSegment(key, sweepLinePos) {
    if (status.find(key)) {
      status.remove(key);
    } else {
      lastPointX = prevX;
      lastPointY = prevY;
      if (status.find(key)) {
        status.remove(key);
      } else {
        // They will get an error :(
      }
      lastPointY = sweepLinePos.y;
      lastPointX = sweepLinePos.x;
    }
  }
}