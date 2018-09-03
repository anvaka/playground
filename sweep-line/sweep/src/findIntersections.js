export default findIntersections;
import SplayTree from 'splaytree';

import {intersectBelowP, EPS} from './geom';
import createSweepStatus from './sweepStatus';

var START_ENDPOINT = 1;
var FINISH_ENDPOINT = 2;
var INTERSECT_ENDPOINT = 3;

function SweepEvent(kind, point, segment) {
  this.kind = kind;
  this.point = point;

  if (segment) this.segments = [segment];
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
    q.add(event)
  }

  function pop() {
    var node = q.pop();
    return node && node.key;
  }

  function byY(aE, bE) {
    var a = aE.point, b = bE.point;

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
    var foundSegments = sweepStatus.findSegmentsThatContain(p.point);

    // p.segments is only available for start events.
    var ucSegments = union(p.segments, foundSegments.interior);
    var lcSegments = union(foundSegments.lower, foundSegments.interior);
    var lucSegments = union(ucSegments, lcSegments);

    if (lucSegments && lucSegments.length > 1) {
      reportIntersection(p, lucSegments);
    }

    sweepStatus.deleteSegments(lcSegments);
    ucSegments.reverse();
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
        new SweepEvent(INTERSECT_ENDPOINT, intersection)
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

    eventQueue.push(
      new SweepEvent(START_ENDPOINT, start, segment)
    );
    eventQueue.push(
      new SweepEvent(FINISH_ENDPOINT, end)
    )
  }
}
