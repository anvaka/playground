export default findIntersections;
import SplayTree from 'splaytree';
import AVLTree from 'avl';

import {intersectBelowP, EPS, round, samePoint} from './geom';
import createSweepStatus from './sweepStatus';

var START_ENDPOINT = 1;
var FINISH_ENDPOINT = 2;
var INTERSECT_ENDPOINT = 3;

class SweepEvent {
  constructor(kind, point, segment, oneMore) {
    this.kind = kind;
    if (Math.abs(point.x) < EPS) point.x = 0;
    if (Math.abs(point.y) < EPS) point.y = 0;

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
      var skipIt = false;
      this.start && this.start.forEach(x => {
        let ourStart = x.start;
        let ourEnd = x.end;

        other.interior.forEach(s => {
          if (samePoint(s.start, ourStart) || samePoint(s.end, ourStart)) skipIt = true;
          if (samePoint(s.start, ourEnd) || samePoint(s.end, ourEnd)) skipIt = true;
        });
      });

      if (skipIt) return;

      this.end && this.end.forEach(x => {
        let ourStart = x.start;
        let ourEnd = x.end;

        other.interior.forEach(s => {
          if (samePoint(s.start, ourStart) || samePoint(s.end, ourStart)) skipIt = true;
          if (samePoint(s.start, ourEnd) || samePoint(s.end, ourEnd)) skipIt = true;
        });
      });

      if (skipIt) return;

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
    return round(p.x)+ ';' + round(p.y);
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
  // TODO: This might mess up the status tree.
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
  var results = createFoundQueue();

  lines.forEach(insertEndpointsIntoEventQueue);
  if (options && options.control) {
    return {
      next
    };
  }

  var printDebug = false; // options && options.debug;

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
  
    // if (printDebug) {
    //   console.log('handle event point', p.point, p.kind);
    // }
    // TODO: Don't include lower into upper or interior.
    var ucSegments = exclude(union(upper, interior), lower);
    var lcSegments = union(lower, interior);
    var lucSegments = union(ucSegments, lcSegments);

    if (lucSegments && lucSegments.length > 1) {
      reportIntersection(p, lucSegments);
    }

    sweepStatus.deleteSegments(lcSegments, p.point);
    sweepStatus.insertSegments(ucSegments, p.point);

    if (printDebug) {
      sweepStatus.checkDuplicate();
    }

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

      findNewEvent(
        sweepStatus.getLeft(leftMostSegment),
        leftMostSegment.data,
        p
      );

      var rightMostSegment = sweepStatus.getRightMostSegment(ucSegments, p.point);
      if (!rightMostSegment) {
        console.error('Segment is missing. Results are not 100% accurate');
        // TODO: This
        return;
      }

      findNewEvent(rightMostSegment.data, sweepStatus.getRight(rightMostSegment), p);
    }
  }

  function findNewEvent(left, right, p) {
    if (!left || !right) return;

    var intersection = intersectBelowP(left, right, p.point);
    if (!intersection) {
      return;
    }
    var dy = p.point.y - intersection.y
    // TODO: should I add dy to intersection.y?
    if (dy < -EPS) return;
    if (Math.abs(intersection.x) < EPS) intersection.x = 0;
    if (Math.abs(intersection.y) < EPS) intersection.y = 0;

    if (!results.has(intersection)) {
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
    start.x = round(start.x);
    start.y = round(start.y);
    end.x = round(end.x);
    end.y = round(end.y);

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