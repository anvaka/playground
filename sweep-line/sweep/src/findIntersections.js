export default findIntersections;
import SplayTree from 'splaytree';
import AVLTree from 'avl';

import {intersectBelowP, EPS} from './geom';
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
    }

    // if (oneMore) {
    //   this.segments = [segment, oneMore];
    // } else if (segment) {
    //   this.segments = [segment];
    // }
    // this.next = null;
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

function createEventQueue() {
  const q = new SplayTree(byY);

  return {
    isEmpty: isEmpty,
    pop: pop,
    push: push,
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
    // console.log(q.size);
    return node && node.data;
  }

  function byY(a, b) {
    // decreasing Y 
    var res = b.y - a.y;
    if (Math.abs(res) < EPS) {
      // increasing x.
      return a.x - b.x;
    }

    return res;
  }
}


function findIntersections(lines) {
  var foundIntersections = [];
  var eventQueue = createEventQueue();
  var sweepStatus = createSweepStatus();

  lines.forEach(insertEndpointsIntoEventQueue);

  while (!eventQueue.isEmpty()) {
    var eventPoint = eventQueue.pop();
    handleEventPoint(eventPoint);
  }

  return foundIntersections;

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

  function handleEventPoint(p) {
    // var foundSegments = sweepStatus.findSegmentsThatContain(p.point);
    // var interior = foundSegments.interior;
    // var lower = foundSegments.lower
    // var upper = p.kind === START_ENDPOINT ? p.segments : [];

    // debugger;
    var interior = p.interior || []; // [];
    var lower = p.end || []; // [];
    var upper = p.start || []; //[];
  
    var ucSegments = union(upper, interior);
    var lcSegments = union(lower, interior);
    var lucSegments = union(ucSegments, lcSegments);

    if (lucSegments && lucSegments.length > 1) {
      reportIntersection(p, lucSegments);
    }

    sweepStatus.deleteSegments(lcSegments);
    if (interior && interior.length > 0 && ucSegments && ucSegments.length > 1) {
      ucSegments.reverse();
    }
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
    if (intersection) {
      eventQueue.push(
        new SweepEvent(INTERSECT_ENDPOINT, intersection, left, right)
      );
    }
  }

  function reportIntersection(p, segments) {
    foundIntersections.push({point: {
      x: p.point.x,
      y: p.point.y
    }, segments});
  }

  function insertEndpointsIntoEventQueue(segment) {
    var start = segment.start;
    var end = segment.end;

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
