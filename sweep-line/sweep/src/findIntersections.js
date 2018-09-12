export default findIntersections;
import SplayTree from 'splaytree';
import AVLTree from 'avl';

import {intersectBelowP, EPS, samePoint} from './geom';
import createSweepStatus from './sweepStatus';

var START_ENDPOINT = 1;
var FINISH_ENDPOINT = 2;
var INTERSECT_ENDPOINT = 3;

class SweepEvent {
  constructor(kind, point, segment, oneMore) {
    this.kind = kind;
    this.point = point;
    if (kind === START_ENDPOINT) {
      this.start = [segment];
    } else if (kind === FINISH_ENDPOINT) {
      this.end = [segment]
    } else if (kind === INTERSECT_ENDPOINT) {
      this.interior = [segment, oneMore];
      this.knownInterior = new Set();
      this.interior.forEach(l => this.knownInterior.add(l));
    }
  }

  merge(other) {
    if (other.kind === START_ENDPOINT) {
      if (!this.start) this.start = [];
      other.start.forEach(s => this.start.push(s));
    } else if (other.kind === FINISH_ENDPOINT) {
      if (!this.end) this.end = [];
      other.end.forEach(s => this.end.push(s));
    } else if (other.kind === INTERSECT_ENDPOINT) {
      if (!this.interior) {
        this.interior = [];
        this.knownInterior = new Set();
      }
      other.interior.forEach(s => {
        // TODO: Need to not push if we already have such segments.
        if (!this.knownInterior.has(s)) {
          this.interior.push(s);
          this.knownInterior.add(s);
        }
      });
    }
  }
}

function createFoundQueue() {
  var r = new Map();

  return {
    push,
    has,
    toArray
  }

  function push(point, segments) {
    var key = keyPoint(point);
    let current = r.get(key);
    if (current) {
      current.concat(segments);
    } else {
      r.set(key, segments);
    }
  }

  function has(point) {
    var key = keyPoint(point);
    return r.get(key);
  }

  function keyPoint(p) {
    return Math.round(p.x * 1000000)/1000000 + ';' +
          Math.round(p.y * 1000000)/1000000;
  }

  function toArray() {
    var foundIntersections = []
    r.forEach((value, key) => {
      var parts = key.split(';');
      foundIntersections.push({
        point: {
          x: Number.parseFloat(parts[0]),
          y: Number.parseFloat(parts[1])
        },
        segments: value
      });
    })
    return foundIntersections;
  }
}

function createSplayFoundQueue() {
  const q = new SplayTree(byY)

  return {
    push,
    has,
    toArray
  }

  function push(point, segments) {
    var current = q.find(point);
    if (current) {
      current.data.concat(segments);
    } else {
      q.add(point, segments);
    }
  }

  function has(point) {
    return q.find(point);
  }

  function toArray() {
    var foundIntersections = []
    q.forEach(node => {
      foundIntersections.push({
        point: {
          x: node.key.x,
          y: node.key.y
        },
        segments: node.data
      });
    })
    return foundIntersections;
  }
}

function createEventQueue() {
  const q = new SplayTree(byY);
  //const q = new AVLTree(byY);

  return {
    isEmpty: isEmpty,
    size: size,
    pop: pop,
    push: push,
  }

  function size() {
    return q.size;
  }

  function isEmpty() {
    return q.isEmpty();
  }

  function push(event) {
    var current = q.find(event.point);
    if (current) {
      current.data.merge(event);
    } else {
      q.insert(event.point, event);
    }
  }

  function pop() {
    var node = q.pop();
    return node && node.data;
  }
}

function byY(a, b) {
  // decreasing Y 
  var res = b.y - a.y;
  if (Math.abs(res) < EPS) {
    // increasing x.
    res = a.x - b.x;
    if (Math.abs(res) < EPS) res = 0;
  }

  return res;
}


function findIntersections(lines, options) {
  var eventQueue = createEventQueue();
  var sweepStatus = createSweepStatus();
  var results = false ? createSplayFoundQueue() : createFoundQueue();

  lines.forEach(insertEndpointsIntoEventQueue);
  if (options && options.control) {
    return {
      next
    };
  }

  while (!eventQueue.isEmpty()) {
    var eventPoint = eventQueue.pop();
    handleEventPoint(eventPoint);
  }

  return results.toArray();

  function next() {
    if (eventQueue.isEmpty()) {
      options.control.done(results.toArray());
    } else {
      var eventPoint = eventQueue.pop();
      handleEventPoint(eventPoint);
      options.control.step(sweepStatus, eventQueue, results)
    }
  }

  function union(a, b) {
    if (!a) return b;
    if (!b) return a;

    // TODO: memory/performance. Likely you can reuse either A or B.
    var result = new Set(a);
    for (var i = 0; i < b.length; ++i) {
      result.add(b[i]);
    }

    return Array.from(result);
  }

  function exclude(src, test) {
    if (!src || !test) return src;
    test.forEach(i => {
      var idx = src.indexOf(i);
      if (idx > -1) {
        src.splice(idx, 1);
      }
    })

    return src;
  }

  function handleEventPoint(p) {
    var interior = p.interior || []; // [];
    var lower = p.end || []; // [];
    var upper = p.start || []; //[];
  
    // console.log('handle event point', p.point, p.kind);
    // TODO: Don't include lower into upper or interior.
    var ucSegments = exclude(union(upper, interior), lower);
    var lcSegments = union(lower, interior);
    var lucSegments = union(ucSegments, lcSegments);

    if (lucSegments && lucSegments.length > 1) {
      reportIntersection(p, lucSegments);
    }

    sweepStatus.deleteSegments(lcSegments);
    // if (interior && interior.length > 0 && ucSegments && ucSegments.length > 1) {
    //   // No need to reverse, since insertSegments drop them all anyway
    //   // ucSegments.reverse();
    // }
    sweepStatus.insertSegments(ucSegments, p.point);

    var sLeft, sRight;

    var hasNoCrossing = (!ucSegments || ucSegments.length === 0);

    if (hasNoCrossing) {
      var leftRight = sweepStatus.getLeftRightPoint(p.point);
      sLeft = leftRight.left;
      if (!sLeft) return;

      sRight = leftRight.right;
      if (!sRight) return;

      findNewEvent(sLeft, sRight, p);
    } else {
      var leftMostSegment = sweepStatus.getLeftMostSegment(ucSegments, p.point);

      leftRight = sweepStatus.getLeftRight(leftMostSegment); 
      sLeft = leftRight.left;
      findNewEvent(sLeft, leftMostSegment.data, p);

      var rightMostSegment = sweepStatus.getRightMostSegment(ucSegments, p.point);

      leftRight = sweepStatus.getLeftRight(rightMostSegment); 
      sRight = leftRight.right;
      findNewEvent(rightMostSegment.data, sRight, p);
    }
  }

  function findNewEvent(left, right, p) {
    if (!left || !right) return;

    var intersection = intersectBelowP(left, right, p.point);
    if (intersection && intersection.y <= p.point.y && !results.has(intersection)) {
      eventQueue.push(
        new SweepEvent(INTERSECT_ENDPOINT, intersection, left, right)
      );
    }
  }

  function reportIntersection(p, segments) {
    results.push(p.point, segments);
  }

  function insertEndpointsIntoEventQueue(segment) {
    var start = segment.start;
    var end = segment.end;

    if (Math.abs(start.x - end.x) < EPS) {
      console.warn('Cannot insert horizontal segment :(');
      start.x += 0.1;
      end.x -= 0.1;
    }

    if ((start.y < end.y) || (
        (start.y === end.y) && (start.x > end.x))
      ) {
      var temp = start;
      start = segment.start = end; 
      end = segment.end = temp;
    }

    var startEvent = new SweepEvent(START_ENDPOINT, start, segment)
    var endEvent = new SweepEvent(FINISH_ENDPOINT, end, segment)
    eventQueue.push(startEvent);
    eventQueue.push(endEvent)
  }
}