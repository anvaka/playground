import SplayTree from 'splaytree';
import {samePoint, isInterior, getIntersectionXPoint} from './geom'


export default function createSweepStatus() {
  var lastPoint;
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
    var ak = getIntersectionXPoint(a.segment, lastPoint);
    var bk = getIntersectionXPoint(b.segment, lastPoint);
    var res = ak - bk;
    // var res = a.x - b.x;
    if (Math.abs(res) < 0.0001) {
      return a.order - b.order;
    }
    return res;
  }

  function getLeftMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }
    segments.sort((a, b) => {
      var ak = getIntersectionXPoint(a, lastPoint);
      var bk = getIntersectionXPoint(b, lastPoint);
      var res = ak - bk;
      // var res = a.x - b.x;
      if (Math.abs(res) < 0.0001) {
        return a.order - b.order;
      }
      return res;
    });
      
    return status.find(segments[0].key);
  }

  function getRightMostSegment(segments) {
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }
    if (segments.length === 1) {
      return status.find(segments[0].key);
    }
    segments.sort((a, b) => {
      var ak = getIntersectionXPoint(a, lastPoint);
      var bk = getIntersectionXPoint(b, lastPoint);
      var res = ak - bk;
      // var res = a.x - b.x;
      if (Math.abs(res) < 0.0001) {
        return a.order - b.order;
      }
      return res;
    });
      
    return status.find(segments[segments.length - 1].key);
  }

  function getLeftRightPoint(p) {
    var all = status.keys()
    var right, left, leftKey;
    for (var i = 0; i < all.length; ++i) {
      var currentKey = all[i];
      if (currentKey.x > p.x && !right) {
        var node = status.find(currentKey);
        right = node.data
      } else if (currentKey.x < p.x) {
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
    //   console.log(JSON.stringify(node.key) + ' ' + node.data.name);
    // })

    function insertOneSegment(segment) {
      var x = getIntersectionXPoint(segment, sweepLinePos.y)
      var key = {x: x, order: 0, segment: segment};
      var node = status.find(key);
      while (node) {
        key.order += 1;
        node = status.find(key);
      }

      lastPoint = sweepLinePos.y - 0.01;

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