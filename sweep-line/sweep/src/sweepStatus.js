import SplayTree from 'splaytree';
import AVLTree from 'avl';
import {samePoint, isInterior, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPointY;
  var lastPointX;
  var status = new SplayTree(compareKeys, /* noDupes: */ false);
  //var status = new AVLTree(compareKeys); //, /* noDupes: */ true);

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
      return status.find(segments[0].key);
    }

    segments.sort((a, b) => compareSegments(a, b, true));
    return status.find(segments[0].key);
  }

  function getRightMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }

    segments.sort((a, b) => compareSegments(a, b, true));
    return status.find(segments[segments.length - 1].key);
  }

  function getLeftRightPoint(p) {
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
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;

    // var all = status.values();
    // status.clear();
    // all.forEach(insertOneSegment);
    segments.forEach(insertOneSegment);

    console.log('status line: ', sweepLinePos.x, sweepLinePos.y)
    status.forEach(node => {
      var x = getIntersectionXPoint(node.data, lastPointX, lastPointY);
      console.log(x + ' ' + node.data.name);
    })

    function insertOneSegment(segment) {
      var key = {segment};
      status.insert(key, segment);
      segment.key = key;
    }
  }

  function deleteSegments(segments) {
    segments.forEach(deleteOneSegment);
  }

  function deleteOneSegment(segment) {
    var node = status.remove(segment.key);
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