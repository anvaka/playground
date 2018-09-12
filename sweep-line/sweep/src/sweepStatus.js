import SplayTree from 'splaytree';
import AVLTree from 'avl';
import {samePoint, isInterior, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPointY, oldPointY;
  var lastPointX, oldPointX;
  var useSegmentPoint = false;
  var status = new SplayTree(compareKeys, /* noDupes: */ false);
 // var status = new AVLTree(compareKeys, /* noDupes: */ true);

  return {
    findSegmentsThatContain,
    deleteSegments,
    insertSegments,
    getLeftRight,
    getLeftRightPoint,
    getLeftMostSegment,
    getRightMostSegment,
    status,
    getLastPoint() {
      return {x: lastPointX, y: lastPointY};
    }
  }

  function compareKeys(a, b) {
    return compareSegments(a.segment, b.segment)
  }

  function compareSegments(a, b) {
    if (a === b) return 0;

    var lpx = lastPointX;
    var lpy = lastPointY
    if (useSegmentPoint) {
      lpx = oldPointX;
      lpy = oldPointY;
    }
    var ak = getIntersectionXPoint(a, lpx, lpy);
    var bk = getIntersectionXPoint(b, lpx, lpy);

    var res = ak - bk;
    if (Math.abs(res) < Number.EPSILON) {
      var aAngle = Math.atan2(a.start.y - a.end.y, a.start.x - a.end.x);
      var bAngle = Math.atan2(b.start.y - b.end.y, b.start.x - b.end.x);
      return aAngle - bAngle;
    }
    return res;
  }

  function getLeftMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }

    segments.sort(compareSegments);
    return status.find(segments[0].key);
  }

  function getRightMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }

    segments.sort(compareSegments);
    return status.find(segments[segments.length - 1].key);
  }

  function getLeftRightPoint(p) {
    // var current = status._root;
    // if (!current) return {left: null, right: null};
    // var keyVal = getIntersectionXPoint(current.key.segment, lastPoint);
    // // Find the left and right neighbours of p
    // if (p.x < keyVal) {
    //   current = current.left;
    // }

    var all = status.keys()
    var right, left, leftKey;
    for (var i = 0; i < all.length; ++i) {
      var currentKey = all[i];
      var x = getIntersectionXPoint(currentKey.segment, p.x, p.y);
      // currentKey.x = x;
      if (x > p.x && !right) {
        // var node = status.findStatic(currentKey);
        // right = node.data
        right = currentKey.segment;
      } else if (x < p.x) {
        leftKey = currentKey;
      }
    }

    left = leftKey && status.find(leftKey);
    return {
      left: left && left.data,
      right
    };
  }

  function getLeftRight(node) {
    var left = status.prev(node);
    var right = status.next(node);
    
    return {
      left: left && left.data,
      right: right && right.data
    }
  }

  function insertSegments(segments, sweepLinePos) {
    // var all = status.values();
    // status.clear();

    // all.forEach(insertOneSegment);
    segments.forEach(insertOneSegment);

    // console.log('status line: ')
    // status.forEach(node => {
    //   var x = getIntersectionXPoint(node.data, lastPointX, lastPointY);
    //   console.log(node.key.x + '#' + x + ' ' + node.data.name);
    // })

    function insertOneSegment(segment) {
      if (segment.name == '2,5') {
        console.log(segment, '+');
      }
      oldPointX = lastPointX;
      oldPointY = lastPointY;
      lastPointY = sweepLinePos.y;
      //if (interior) {
        // lastPointY -= 0.0001;// Number.EPSILON
      //}
      lastPointX = sweepLinePos.x;
      var x = getIntersectionXPoint(segment, lastPointX, lastPointY);
      var key = {x, segment};
      // segment.key = key;
      // var node = status.find(key);
      // while (node) {
      //   order += 1;
      //   key = {x, order, segment};
      //   node = status.find(key);
      // }

      status.insert(key, segment);
      segment.key = key;
    }
  }

  function deleteSegments(segments) {
    // useSegmentPoint = true;
    segments.forEach(deleteOneSegment);
    // useSegmentPoint = false;
  }

  function deleteOneSegment(segment) {
    var isTest = segment.name == '2,5';
    if (isTest) {
      console.log(segment, '-');
    }
    var node = status.remove(segment.key, isTest);
      //if (!node) throw new Error('wtf?')
  }

  function findSegmentsThatContain(point) {
    var lower = [];
    var interior = [];

    // TODO: Don't need to do full scan
    status.forEach(node => {
      var current = node.data;
      // TODO: Don't do this
      current.key = node.key;
      if (samePoint(current.end, point)) {
        lower.push(current)
      } else if (isInterior(current, point)) {
        interior.push(current)
      }
    })

    return {lower, interior};
  }
}