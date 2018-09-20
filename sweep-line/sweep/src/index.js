import createEventQueue from './createEventQueue';
import createSweepStatus from './sweepStatus';
import SweepEvent from './SweepEvent';

import {intersectSegments, EPS, pseudoAngle} from './geom';
import {START_ENDPOINT, FINISH_ENDPOINT, INTERSECT_ENDPOINT} from './eventTypes';

var EMPTY = [];

export default function findIntersections(lines, options) {
  var eventQueue = createEventQueue();
  var sweepStatus = createSweepStatus();
  var results = (options && options.results) || [];
  var reportIntersection = (options && options.ignoreEndpoints) ? 
    reportIgnoreEndpoints : 
    reportIncludeIntersection;

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

  return results;

  function next() {
    if (eventQueue.isEmpty()) {
      options.control.done(results);
    } else {
      var eventPoint = eventQueue.pop();
      handleEventPoint(eventPoint);
      options.control.step(sweepStatus, results, eventQueue)
    }
  }

  function union(a, b) {
    if (!a) return b;
    if (!b) return a;

    return a.concat(b);
  }

  function handleEventPoint(p) {
    var interior = p.interior || EMPTY;
    var lower = p.to || EMPTY; 
    var upper = p.from || EMPTY;
  
    // if (printDebug) {
    //   console.log('handle event point', p.point, p.kind);
    // }
    var uLength = upper.length;
    var iLength = interior.length;
    var lLength = lower.length;

    if (uLength + iLength + lLength > 1) {
      p.isReported = true;
      if (p.checkDuplicates) {
        // the event was merged from another kind. We need to make sure
        // that no interior point are actually lower/upper point
        interior = removeDuplicate(interior, lower, upper);
        iLength = interior.length;
        p.checkDuplicate = false;
      }
      reportIntersection(p.point, interior, lower, upper);
    }

    if (p.checkDuplicates) {
      // the event was merged from another kind. We need to make sure
      // that no interior point are actually lower/upper point
      interior = removeDuplicate(interior, lower, upper);
      iLength = interior.length;
    }
    sweepStatus.deleteSegments(lower, interior, p.point);
    sweepStatus.insertSegments(interior, upper, p.point);

    if (printDebug) {
      sweepStatus.checkDuplicate();
    }

    var sLeft, sRight;

    var hasNoCrossing = (uLength + iLength === 0);

    if (hasNoCrossing) {
      var leftRight = sweepStatus.getLeftRightPoint(p.point);
      sLeft = leftRight.left;
      if (!sLeft) return;

      sRight = leftRight.right;
      if (!sRight) return;

      findNewEvent(sLeft, sRight, p);
    } else {
      var boundarySegments = sweepStatus.getBoundarySegments(upper, interior);

      findNewEvent(boundarySegments.beforeLeft, boundarySegments.left, p);
      findNewEvent(boundarySegments.right, boundarySegments.afterRight, p);
    }
  }

  function findNewEvent(left, right, p) {
    if (!left || !right) return;

    var intersection = intersectSegments(left, right);
    if (!intersection) return;

    var dy = p.point.y - intersection.y
    // TODO: should I add dy to intersection.y?
    if (dy < -EPS) {
      // this means intersection happened after the sweep line. 
      // We already processed it.
      return;
    }

    // Need to adjust floating point for this special case,
    // since otherwise it gives rounding errors:
    if (Math.abs(intersection.x) < EPS) intersection.x = 0;
    if (Math.abs(intersection.y) < EPS) intersection.y = 0;

    var current = eventQueue.find(intersection);
    if (current && current.isReported) {
      debugger;
      // We already reported this event. No need to add it one more time
      // TODO: Is this case even possible?
      return;
    }

    var event = new SweepEvent(INTERSECT_ENDPOINT, intersection, left, right)
    if (current) {
      eventQueue.merge(current, event);
    } else {
      eventQueue.insert(event);
    }
  }

  function reportIncludeIntersection(p, interior, lower, upper) {
    results.push({
      point: p, 
      segments: union(union(interior, lower), upper)
    });
  }

  function reportIgnoreEndpoints(p, interior) {
    if (interior.length > 0) {
      results.push({
        point: p, 
        segments: interior
      });
    }
  }

  function insertEndpointsIntoEventQueue(segment) {
    var from = segment.from;
    var to = segment.to;

    roundNearZero(from);
    roundNearZero(to);

    var dy = from.y - to.y;
    if (Math.abs(dy) < 1e-5) {
      from.y = to.y;
      segment.dy = 0;
    }
    if ((from.y < to.y) || (
        (from.y === to.y) && (from.x > to.x))
      ) {
      var temp = from;
      from = segment.from = to; 
      to = segment.to = temp;
    }
    segment.dy = from.y - to.y;
    segment.dx = from.x - to.x;
    segment.angle = pseudoAngle(segment.dy, segment.dx);

    var startEvent = new SweepEvent(START_ENDPOINT, from, segment)
    var endEvent = new SweepEvent(FINISH_ENDPOINT, to, segment)
    eventQueue.push(startEvent);
    eventQueue.push(endEvent)
  }
}

function removeDuplicate(interior, lower, upper) {
  var result = [];
  for (var i = 0; i < interior.length; ++i) {
    var s = interior[i];
    if (lower.indexOf(s) < 0 && upper.indexOf(s) < 0) result.push(s);
  }
  return result;
}

function roundNearZero(point) {
  if (Math.abs(point.x) < EPS) point.x = 0;
  if (Math.abs(point.y) < EPS) point.y = 0;
}