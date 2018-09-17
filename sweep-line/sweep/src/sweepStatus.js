import SplayTree from 'splaytree';
import AVLTree from 'avl';
import {samePoint, EPS, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPointY;
  var lastPointX;
  var useBelow = false;
  var status = new SplayTree(compareSegments);
  //var status = new AVLTree(compareSegments); //, /* noDupes: */ true);

  return {
    deleteSegments,
    insertSegments,
    getLeft,
    getRight,
    getLeftRightPoint,
    getBoundarySegments,
    status,
    checkDuplicate,
    printStatus,
    getLastPoint() {
      return {x: lastPointX, y: lastPointY};
    }
  }

  function compareSegments(a, b) {
    if (a === b) return 0;

    var lpx = lastPointX;
    var lpy = lastPointY

    var ak = getIntersectionXPoint(a, lpx, lpy);
    var bk = getIntersectionXPoint(b, lpx, lpy);

    var res = ak - bk;
    if (Math.abs(res) < 0.0000001) {

      var day = a.start.y - a.end.y;
      // move horizontal to end
      if (Math.abs(day) < 0.0000001) {
        return useBelow ? -1 : 1;
      }
      var dby = b.start.y - b.end.y;
      if (Math.abs(dby) < 0.0000001) {
        return useBelow ? 1 : -1;
      }
      var aAngle = Math.atan2(a.start.y - a.end.y, a.start.x - a.end.x);
      var bAngle = Math.atan2(b.start.y - b.end.y, b.start.x - b.end.x);
      return useBelow ? bAngle - aAngle : aAngle - bAngle;
    }
    return res;
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
    var left = status.find(leftMost);
    if (!left) {
      throw new Error('Left is missing. Precision error?');
    }
    var beforeLeft = status.prev(left);

    var right = status.find(rightMost);
    if (!right) {
      throw new Error('Right is missing. Precision error?');
    }

    var afterRight = right && status.next(right);

    return {
      beforeLeft: beforeLeft && beforeLeft.key,
      left: left.key,
      right: right.key,
      afterRight: afterRight && afterRight.key
    }
  }

  function getLeftRightPoint(p) {
    var all = status.keys()
    var right, left;
    for (var i = 0; i < all.length; ++i) {
      var currentKey = all[i];
      var x = getIntersectionXPoint(currentKey, p.x, p.y);
      if (x > p.x && !right) {
        right = currentKey;
      } else if (x < p.x) {
        left = currentKey;
      }
    }

    return {
      left: left,
      right: right
    };
  }

  function getLeft(node) {
    var left = status.prev(node);
    return left && left.key;
  }

  function getRight(node) {
    var right = status.next(node);
    return right && right.key;
  }

  function checkDuplicate() {
    var prev;
    status.forEach(node => {
      var current = node.key;

      if (prev) {
        if (samePoint(prev.start, current.start) && samePoint(prev.end, current.end)) {
          console.error('Duplicate key in the status! This may be caused by Floating Point rounding error');
          debugger;
        }
      }
      // var x = getIntersectionXPoint(node.key, lastPointX, lastPointY);
      prev = current;
    })

  }

  function printStatus() {
    console.log('status line: ', lastPointX, lastPointY);
    status.forEach(node => {
      var x = getIntersectionXPoint(node.key, lastPointX, lastPointY);
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

  function deleteSegments(segments, sweepLinePos) {
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;
    useBelow = true;
    segments.forEach(deleteOneSegment);
    useBelow = false;
  }

  function deleteOneSegment(segment) {
    var node = status.remove(segment);
      //if (!node) throw new Error('wtf?')
  }
}