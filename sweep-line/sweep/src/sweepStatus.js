import SplayTree from 'splaytree';
import AVLTree from 'avl';
import {samePoint, EPS, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPointY;
  var lastPointX;
  var status = new SplayTree(compareSegments);
  //var status = new AVLTree(compareSegments); //, /* noDupes: */ true);
  window.elapsed = 0;

  return {
    deleteSegments,
    insertSegments,
    getLeft,
    getRight,
    getLeftRightPoint,
    getLeftMostSegment,
    getRightMostSegment,
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
        return 1;
      }
      var dby = b.start.y - b.end.y;
      if (Math.abs(dby) < 0.0000001) {
        return -1;
      }
      var aAngle = Math.atan2(a.start.y - a.end.y, a.start.x - a.end.x);
      var bAngle = Math.atan2(b.start.y - b.end.y, b.start.x - b.end.x);
      return aAngle - bAngle;
    }
    return res;
  }

  function getLeftMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0]);
    }

    segments.sort((a, b) => compareSegments(a, b));
    return status.find(segments[0]);
  }

  function getRightMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0]);
    }
    // Assuming getLeftMostSegment is called!
    // Otherwise need to sort:
    // segments.sort((a, b) => compareSegments(a, b));

    // var now = performance.now();
    var lastOne = segments[segments.length - 1];
    var result = status.find(lastOne);
    return result;
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

  function insertSegments(segments, sweepLinePos) {
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;

    // var all = status.values();
    // status.clear();
    // all.forEach(insertOneSegment);
    segments.forEach(insertOneSegment);

    function insertOneSegment(segment) {
      status.add(segment, segment);
    }
  }

  function deleteSegments(segments) {
    segments.forEach(deleteOneSegment);
  }

  function deleteOneSegment(segment) {
    var node = status.remove(segment);
      //if (!node) throw new Error('wtf?')
  }
}