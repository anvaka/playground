import createEventQueue from './createEventQueue';
import createSweepStatus from './sweepStatus';
import SweepEvent from './SweepEvent';

import {intersectSegments, EPS, angle, samePoint} from './geom';
import {START_ENDPOINT, FINISH_ENDPOINT, INTERSECT_ENDPOINT} from './eventTypes';

/**
 * A point on a line
 * 
 * @typedef {Object} Point
 * @property {number} x coordinate
 * @property {number} y coordinate
 */


/**
 * @typedef {Object} Segment 
 * @property {Point} from start of the segment
 * @property {Point} to end of the segment
 */

/**
 * @typedef {function(point : Point, interior : Segment[], lower : Segment[], upper : Segment[])} ReportIntersectionCallback
 */

/**
 * @typedef {Object} ISectOptions 
 * @property {ReportIntersectionCallback} onFound 
 */

 /**
  * @typedef {Object} ISectResult
  */

// We use EMPTY array to avoid pressure on garbage collector. Need to be
// very cautious to not mutate this array.
var EMPTY = [];

/**
 * Finds all intersections among given segments.
 * 
 * The algorithm follows "Computation Geometry, Algorithms and Applications" book
 * by Mark de Berg, Otfried Cheong, Marc van Kreveld, and Mark Overmars.
 * 
 * Line is swept top-down
 * 
 * @param {Segment[]} segments
 * @param {ISectOptions=} options
 * @returns {ISectResult}
 */
export default function isect(segments, options) {
  var results = [];
  var reportIntersection = (options && options.onFound) || defaultIntersectionReporter;

  var onError = (options && options.onError) || defaultErrorReporter;

  var eventQueue = createEventQueue();
  var sweepStatus = createSweepStatus(onError);
  segments.forEach(addSegment);

  return {
    /**
     * Find all intersections synchronously.
     * 
     * @returns array of found intersections.
     */
    run,

    /**
     * Performs a single step in the sweep line algorithm
     * 
     * @returns true if there was something to process; False if no more work to do
     */
    step,

    // Methods below are low level API for fine-grained control.
    // Don't use it unless you understand this code thoroughly

    /**
     * Add segment into the 
     */
    addSegment,

    /**
     * Direct access to event queue. Queue contains segment endpoints and
     * pending detected intersections.
     */
    eventQueue, 

    /**
     * Direct access to sweep line status. "Status" holds information about
     * all intersected segments.
     */
    sweepStatus,

    /**
     * Access to results array. Works only when you use default onFound() handler
     */
    results
  }

  function run() {
    while (!eventQueue.isEmpty()) {
      var eventPoint = eventQueue.pop();
      if (handleEventPoint(eventPoint)) {
        // they decided to stop.
        return;
      };
    }

    return results;
  }

  function step() {
    if (!eventQueue.isEmpty()) {
      var eventPoint = eventQueue.pop();
      handleEventPoint(eventPoint);
      // Note: we don't check results of `handleEventPoint()`
      // assumption is that client controls `step()` and thus they 
      // know better if they want to stop.
      return true;
    }
    return false;
  }

  function handleEventPoint(p) {
    var interior = p.interior || EMPTY;
    var lower = p.to || EMPTY; 
    var upper = p.from || EMPTY;
  
    var uLength = upper.length;
    var iLength = interior.length;
    var lLength = lower.length;
    var hasIntersection = uLength + iLength + lLength > 1;

    if (p.checkDuplicates) {
      // the event was merged from another kind. We need to make sure
      // that no interior point are actually lower/upper point
      interior = removeDuplicate(interior, lower, upper);
      iLength = interior.length;
      p.checkDuplicate = false;
    }

    if (hasIntersection) {
      p.isReported = true;
      if (reportIntersection(p.point, interior, lower, upper)) {
        return true;
      }
    }

    sweepStatus.deleteSegments(lower, interior, p.point);
    sweepStatus.insertSegments(interior, upper, p.point);

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

    return false;
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
    roundNearZero(intersection);

    var current = eventQueue.find(intersection);

    if (current && current.isReported) {
      // We already reported this event. No need to add it one more time
      // TODO: Is this case even possible?
      onError('We already reported this event.');
      return;
    }

    var event = new SweepEvent(INTERSECT_ENDPOINT, intersection, left, right)
    if (current) {
      eventQueue.merge(current, event);
    } else {
      eventQueue.insert(event);
    }
  }

  function defaultIntersectionReporter(p, interior, lower, upper) {
    results.push({
      point: p, 
      segments: union(union(interior, lower), upper)
    });
  }

  function addSegment(segment) {
    var from = segment.from;
    var to = segment.to;

    // Small numbers give more precision errors. Rounding them to 0.
    roundNearZero(from);
    roundNearZero(to);

    var dy = from.y - to.y;

    // Note: dy is much smaller then EPS on purpose. I found that higher
    // precision here does less good - getting way more rounding errors.
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

    // We pre-compute some immutable properties of the segment
    // They are used quite often in the tree traversal, and pre-computation
    // gives significant boost:
    segment.dy = from.y - to.y;
    segment.dx = from.x - to.x;
    segment.angle = angle(segment.dy, segment.dx);

    // var prev = eventQueue.find(from)
    // if (prev) {
    //   var prevFrom = prev.data.from;
    //   if (prevFrom) {
    //     for (var i = 0; i < prevFrom.length; ++i) {
    //       var s = prevFrom[i];
    //       if (samePoint(s.to, to)) {
    //         reportIntersection(s.from, [], s.from, s.to);
    //         reportIntersection(s.to, [], s.from, s.to);
    //         return;
    //       }
    //     }
    //   }
    // }

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

function defaultErrorReporter(errorMessage) {
  throw new Error(errorMessage);
}

function union(a, b) {
  if (!a) return b;
  if (!b) return a;

  return a.concat(b);
}
