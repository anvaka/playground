import SplayTree from 'splaytree';
import AVLTree from 'avl';
import {samePoint, isInterior, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPointY;
  var lastPointX;
  var status = new SplayTree(compareKeys, /* noDupes: */ true);
 // var status = new AVLTree(compareKeys, /* noDupes: */ true);

  return {
    findSegmentsThatContain,
    deleteSegments,
    insertSegments,
    getLeftRight,
    getLeftRightPoint,
    getLeftMostSegment,
    getRightMostSegment
  }

  function compareKeys(a, b) {
    return compareSegments(a.segment, b.segment)
  }

  function compareSegments(a, b) {
    var ak = getIntersectionXPoint(a, lastPointX, lastPointY);
    var bk = getIntersectionXPoint(b, lastPointX, lastPointY);
    var res = ak - bk;
    if (Math.abs(res) < 0.0001) {
      return (a.key.order) - (b.key.order);
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
      var x = getIntersectionXPoint(currentKey.segment, lastPointX, lastPointY);
      currentKey.x = x;
      if (x > p.x && !right) {
        var node = status.findStatic(currentKey);
        right = node.data
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
    var all = status.values();
    status.clear();

    all.forEach(insertOneSegment);
    segments.forEach(insertOneSegment);

    // console.log('status line: ')
    // status.forEach(node => {
    //   console.log(node.key.x + '#' + node.key.order + ' ' + node.data.name);
    // })

    function insertOneSegment(segment) {
      lastPointY = sweepLinePos.y - 0.01;
      lastPointX = sweepLinePos.x;
      var x = getIntersectionXPoint(segment, lastPointX, lastPointY);
      var key = {x: x, order: 0, segment: segment};
      segment.key = key;
      var node = status.find(key);
      while (node) {
        key.order += 1;
        node = status.find(key);
      }

      status.insert(key, segment);
      segment.key = key;
    }
  }

  function deleteSegments(segments) {
    segments.forEach(deleteOneSegment);
  }

  function deleteOneSegment(segment) {
    if (segment.key) status.remove(segment.key);
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