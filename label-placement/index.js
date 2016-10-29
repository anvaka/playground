/* globals sivg panzoom countries */

// var simplePoints = simplify(points);
var testPhrase = 'the richest country in the world';
var scene = document.getElementById('scene');
var colors = getColors();
var textMeasure = createTextMeasure(scene);
// console.log(textMeasure.measure(testPhrase, 3));

panzoom(scene);

var geometries = [];
countries.forEach(function(country, i) {
  var countryGeometry = makeCountryGeometry(country.path, country.id);
  geometries.push(countryGeometry);
  //renderLineChart(countryGeometry, 0, i * 110, country.id);
  renderCountry(countryGeometry, 110, i * 110, country.id);
})

renderLabels(geometries);

// outlineIntersections(countryGeometry.candidates);

function renderLabels(geometries) {
  geometries.forEach(renderPhrase);

  function renderPhrase(geometry) {
    var countryId = geometry.id;
    var text = countryId; //testPhrase; // countryId
    var textLayout = geometry.getTextLayout(text); //countryId);

    textLayout.removeMe.forEach(function(chunk) {
      var width = chunk.right - chunk.left;
       // scene.appendChild(sivg('rect', {
       //   fill: 'transparent',
       //   stroke: 'red',
       //   x: chunk.left,
       //   y: chunk.top,
       //   width: width,
       //   height: chunk.bottom - chunk.top
       // }));
      var textWidth = textMeasure.measure(text, chunk.fontSize).preciseOneLineRect.width;
      var chunkElement = sivg('text', {
        'font-size': chunk.fontSize,
        x: chunk.left + (width - textWidth)/2, // + (baseRect.width - size.oneLineRect.width) * 0.5 ,
        y: chunk.bottom - chunk.fontSize  * 0.3 // baseRect.top + baseRect.height
      });
      chunkElement.text(chunk.text);
      scene.appendChild(chunkElement);
      // scene.appendChild(sivg('path', {
      //   stroke: 'red',
      //   'stroke-width': 0.1,
      //   d: 'M' + toPath({
      //     x: chunk.left,
      //     y: chunk.top
      //   }) + 'L' + toPath({
      //     x: chunk.right,
      //     y: chunk.top
      //   })
      // }));
    });
    var start = textLayout.allRectangles.start;
    if (start) {
        appendRect(start);
        textLayout.allRectangles.north.forEach(appendRect);
        textLayout.allRectangles.south.forEach(appendRect);
    }

    function appendRect(rect) {
       scene.appendChild(sivg('rect', {
         fill: 'transparent',
         stroke: 'red',
         x: rect.left,
         y: rect.top,
         width: rect.right - rect.left,
         height: rect.bottom - rect.top
       }));
    }

    // var baseRect = geometry.baseOffest;
    // var size = textMeasure.measure(countryId, fontSize);
    //
    // var name = sivg('text', {
    //   'font-size': fontSize, // TODO: Should come from polygon area
    //   x: baseRect.left + (baseRect.width - size.oneLineRect.width) * 0.5 ,
    //   y: baseRect.top + baseRect.height
    // });
    //
    // name.text(countryId);
    // scene.appendChild(name);
    // testPhrase
  }
}

function renderCountry(country, gdx, gdy) {
  var bounds = country.bounds;
  var scaler = Math.max(bounds.width, bounds.height);

  var countryContainer = sivg('g');
  var path = country.points/*.map(toZero)*/.map(toPath).join('L');

  countryContainer.appendChild(sivg('path', {
    id: country.id,
    fill: colors[country.id] || '#F2ECCF',
    'stroke-width': 0.3,
    'vector-effect':'non-scaling-stroke',
    stroke: '#333',
    d: 'M' + path + 'Z'
  }));

  scene.appendChild(countryContainer);

  function toZero(p) {
    return {
      x: (p.x - bounds.minX) * 100 / scaler + gdx,
      y: (p.y - bounds.minY) * 100 / scaler + gdy
    };
  }
}

// provides an API to iterate over segments inside polyline.
function polyLine(points) {
  // sort by x, so that we know when split-line enters/quits polygon.
  var sortedSegmentIndices = points.map(function(_, i) { return i; })
    .sort(function(firstSegmentIndex, secondSegmentIndex) {
      var a = getSegment(firstSegmentIndex);
      var b = getSegment(secondSegmentIndex);

      // make sure to sort by the smallest coordinate in each segment, because
      // polyline may go from east to west too.
      var minA = Math.min(a.from.x, a.to.x);
      var minB = Math.min(b.from.x, b.to.x);

      return minA - minB;
    });

  return {
    forEachSegment: forEachSegment,
    isLocalExtremum: isLocalExtremum
  };

  function getSegment(segmentIndex) {
    return {
      from: getPoint(segmentIndex),
      to: getPoint(segmentIndex + 1)
    };
  }


  function isLocalExtremum(segmentIndex) {
    var prev = getPoint(segmentIndex - 1);
    var next = getPoint(segmentIndex + 1);
    var y = getPoint(segmentIndex).y;

    // TODO: equality case?
    return (prev.y < y && next.y < y) || // local maximum
      (prev.y > y && next.y > y); // local minimum
  }

  function getPoint(idx) {
    var inRange = idx % points.length;
    if (inRange < 0) return points[points.length + inRange];
    return points[inRange];
  }

  function forEachSegment(callback) {
    if (points.length === 0) return;

    for (var i = 0; i < points.length; ++i) {
      var startIndex = sortedSegmentIndices[i];
      fireCallbackForSegment(startIndex);
    }

    function fireCallbackForSegment(from) {
      var to = from + 1
      if (to === points.length)
        to = 0; // loop the last point
      callback(points[from], points[to], from, to);
    }
  }
}

function toPath(point) {
  return point.x + ',' + point.y;
}

function findCentroid(points) {
  var x = 0, y = 0;
  var minX = Number.POSITIVE_INFINITY;

  points.forEach(function(p) {
    x += p.x;
    y += p.y;
    if (p.x < minX)
      minX = p.x;
  });

  return {
    x: x / points.length,
    y: y / points.length,
    minX: minX
  }
}

function parseFloat(x) {
  var result = Number.parseFloat(x);
  if (Number.isNaN(result))
    throw new Error(x + ' is not a number');

  return result
}

function log() {
  return; // Comment this line if you need logging.
  console.log.apply(console, arguments);
}


function renderLineChart(country, dx, dy, name) {
  var maxY = Number.NEGATIVE_INFINITY;
  var candidates = country.candidates;
  var bounds = country.bounds;
  var countryWidth = bounds.width
  var countryHeight = bounds.height;
  var scaleY = 100; // * bounds.height/scaler;
  if (countryHeight < countryWidth) {
    scaleY /= countryHeight / countryWidth;
  }
  var totalLength = 0;
  var bestCandidateForLabelBase = 0;
  var bestRank = Number.NEGATIVE_INFINITY;

  var chartPoints = candidates.map(function(candidate, i) {
    var y = candidate.distance.inside;
    if (y > maxY) maxY = y;
    totalLength += y;

    if (candidate.rank > bestRank) {
      bestRank = candidate.rank;
      bestCandidateForLabelBase = i;
    }

    return {
      y: i,
      x: y
    }
  });

  console.log(name, totalLength / 100);

  var chartContainer = sivg('g');
  chartPoints.forEach(p => renderPoint(p, 'red'));
  renderPoint(chartPoints[bestCandidateForLabelBase], 'blue')

  scene.appendChild(chartContainer);

  function renderPoint(point, color) {
    var y = dy + 100 * point.y / scaleY;
    chartContainer.appendChild(sivg('path', {
      stroke: color,
      d: pathLine({
        x: dx,
        y: y
      }, {
        x: dx + point.x * 100 / maxY,
        y: y
      })
    }))
  }
}

function pathLine(from, to) {
  return 'M' + toPath(from) + 'L' + toPath(to);
}

function outlineIntersections(candidates) {
  candidates.forEach(function(line) {
    var segments = line.segments;
    for (var i = 0; i < segments.length - 1; ++i) {
      var pathValue = pathLine(segments[i], segments[i + 1]);
      scene.appendChild(
        sivg('path', {
          stroke: (i % 2) === 0 ? 'red' : 'blue',
          'stroke-width': 0.1,
          fill: '#FFFDDB',
          d: pathValue
        })
      );
    }
  });
}

function makeCountryGeometry(countryPath, countryId) {
  var points = parsePoints(countryPath);
  var bounds = getBounds(points);
  var slicesCount = 100;
  var slicer = makeSlicer(bounds, slicesCount);

  var poly = polyLine(points);
  // TODO: Remove appendSliceLine?
  var lines = {};
  slicer.forEach(appendSliceLine)

  var candidates = Object.keys(lines).map(toRankedCandidates);
  var area = computeAreaInside(candidates);

  // we make each distance inside country normal length (from 0 to 1), so that
  // we can build composite ranking of each line easier.
  normalizeDistances();

  // Compute composite rank now:
  candidates.forEach(computeRank);

  // Find the index of the the horizontal line, that has the highest "rank".
  // That index is our best candidate for label placement.
  var candidateIndex = findBestCandidateIndex();
  // Trnaslate that index into country coordinates
  var ratio = bounds.height/slicesCount;

  // and get the offset - this is where we want to render label by default.
  var yOffset = bounds.minY + ratio * candidateIndex;

  return {
    id: countryId,
    bounds: bounds,
    candidates: candidates,
    points: points,
    getTextLayout: getTextLayout
  };

  function getTextLayout(text) {
    var maxFontSize = 18; // TODO: Make configurable
    var fontSize = Math.max(0.1, getSuggestedFontSize(text));

    console.time(text);
    var allRectangles = getAllRectanglesAtHeight(yOffset, fontSize);
    console.timeEnd(text);

    var rectForHeight = getRectForHeight(yOffset, fontSize);
    var result = {
      removeMe: [],
      allRectangles: allRectangles
    };

    if (rectForHeight) {
      result.removeMe = [{
        fontSize: fontSize,
        text: text,
        right: rectForHeight.right,
        left: rectForHeight.left,
        bottom: rectForHeight.bottom,
        top: rectForHeight.top
      }];
    } else {
      // TODO: implement me. Reduce font size and retry.
      result.removeMe = [{
        fontSize: fontSize,
        text: text,
        right: bounds.maxX,
        left: bounds.minX,
        top: yOffset,
        bottom: yOffset + 1
      }];
    }

    return result;


    function getAllRectanglesAtHeight(midPoint, rectHeight) {
      var rects = [];
      var midPointHeight = (midPoint - bounds.minY);
      var slicesCount = Math.floor(midPointHeight/rectHeight);
      var dy = (midPointHeight - slicesCount * rectHeight);
      var y = bounds.minY + dy;
      var foundRects = 0;
      while (y < bounds.maxY) {
        rects[foundRects++]  = getRectForHeight(y, rectHeight);
        y += rectHeight;
      }

      var startFrom = slicesCount;
      var startRect = rects[startFrom];
      if (!startRect) {
        var nearestIndexOnNorth = getNearestAtNorth(startFrom)
        var nearestIndexOnSouth = getNearestAtSouth(startFrom);
        if (Number.isFinite(nearestIndexOnNorth) && !Number.isFinite(nearestIndexOnSouth)) {
          startFrom = nearestIndexOnNorth;
        } else if (!Number.isFinite(nearestIndexOnNorth) && Number.isFinite(nearestIndexOnSouth)) {
          startFrom = nearestIndexOnSouth;
        } else if (!Number.isFinite(nearestIndexOnNorth) && !Number.isFinite(nearestIndexOnSouth)) {
          return {
            north: [],
            start: null, // not found.
            south: []
          };
        } else {
          var ds = Math.abs(nearestIndexOnSouth - startFrom);
          var dn = Math.abs(nearestIndexOnNorth - startFrom);
          startFrom = ds < dn ? nearestIndexOnSouth : nearestIndexOnNorth;
        }
      }

      var finalRects = {
        north: [],
        start: startRect,
        south: []
      }

      populateFinalRects(startFrom);
      filterNonOverlapingRects(finalRects);

      return finalRects;

      function filterNonOverlapingRects(rects) {
        filter(rects.start, rects.north);
        filter(rects.start, rects.south);

        function filter(start, array) {
          var i = 0;
          while (i < array.length && intersects(start, array[i])) {
            start = array[i];
            i += 1;
          }
          if (i < array.length) {
            array.splice(i);
          }
        }

        function intersects(rect1, rect2) {
          var from = Math.max(rect1.left, rect2.left);
          var to = Math.min(rect1.right, rect2.right);
          return to - from > 0;
        }
      }

      function getNearestAtNorth(startFrom) {
        var idx = startFrom;
        do {
          var candidate = rects[idx];
          if (candidate) return idx;

          idx -= 1;
        } while (idx > -1);
      }

      function getNearestAtSouth(startFrom) {
        var idx = startFrom;
        do {
          var candidate = rects[idx];
          if (candidate) return idx;

          idx += 1;
        } while (idx < foundRects);
      }

      function populateFinalRects(startFrom) {
        var goSouth = true; var southOffset = 1;
        var goNorth = true; var northOffset = 1;

        var candidate;

        while(goSouth || goNorth) {
          if (goNorth) {
            candidate = rects[startFrom - northOffset];
            if (candidate) {
              finalRects.north.push(candidate);
              northOffset += 1;
            } else {
              goNorth = false;
            }
          }

          if (goSouth) {
            candidate = rects[startFrom + southOffset];
            if (candidate) {
              finalRects.south.push(candidate);
              southOffset += 1;
            } else {
              goSouth = false;
            }
          }
        }
      }
    }

    function getRectForHeight(midPoint, height) {
      var top = midPoint - height/2;
      var bottom = midPoint + height/2;
      var topIntervals = getIntervals(top);
      var bottomIntervals = getIntervals(bottom);
      var intersections = findIntersections(topIntervals, bottomIntervals);

      var longestSegment = findLongestSegment(intersections);

      if (!longestSegment) {
        // we may not get any intersections at this height. Which means we cannot
        // fit text entirely here.
        return;
      }

      return {
        left: longestSegment.from,
        top: top,
        right: longestSegment.to,
        bottom: bottom
      };
    }

    function findLongestSegment(segments) {
      var longest = segments[0];

      segments.forEach(function(segment) {
        if (longest.length < segment.length) longest = segment;
      })

      return longest;
    }

    // finds all intersections between two arrays of segments.
    function findIntersections(topIntervals, bottomIntervals) {
      var smaller, larger;
      if (topIntervals.min <= bottomIntervals.min) {
        smaller = topIntervals;
        larger = bottomIntervals;
      } else {
        smaller = bottomIntervals;
        larger = topIntervals;
      }

      var intersections = [];

      while(smaller.hasMore) {
        while (smaller.min > larger.max && larger.hasMore) {
          // this means that our next interval does not intersect first interval
          larger.next();
        }

        if (!larger.hasMore) {
          // we exhasted the interval. All intersections are found.
          break;
        }

        if (smaller.max < larger.min) {
          // this means that smaller interval does not intersect larger one.
          // Move to the next one in this array.
          smaller.next();
          // And if the next one is larger than our largest, then swap
          if (smaller.min > larger.min) {
            swapIntervals();
          }
        } else {
          var from = larger.min;
          var to;
          if (larger.max < smaller.max) {
            to = larger.max;
            larger.next();
          } else {
            to = smaller.max;
            smaller.next();
            swapIntervals();
          }

          intersections.push({
            from: from,
            to: to,
            length: to - from
          });
        }
      }

      return intersections;

      function swapIntervals() {
        var t = smaller;
        smaller = larger;
        larger = t;
      }
    }

    // returns array of intervals, that lie inside country area at offset `yOffset`
    function getIntervals(yOffset) {
      var segments = findSegmentsOnLine({
        y: yOffset,
        x: bounds.minX
      });
      return segmentsCollection(segments);
    }

    function segmentsCollection(segments) {
      var api = {
        min: undefined,
        max: undefined,
        hasMore: undefined,
        next: next,
      };

      var currentIndex = -1;
      next();

      return api;

      function next() {
        currentIndex += 1;
        var enterIndex = currentIndex * 2;
        var exitIndex = enterIndex + 1;
        if (exitIndex < segments.length) {
          api.hasMore = true;
          api.min = segments[enterIndex].x;
          api.max = segments[exitIndex].x;
        } else {
          api.hasMore = false;
          api.min = undefined;
          api.max = undefined;
        }
      }
    }

    function getSuggestedFontSize(text) {
      if (text.length === 0) return 0;

      // TODO: This needs to be improved. Current idea is that we want label
      // to occupy less than 15% (0.15) of an area.
      var maxCountrySpaceRatio = 0.15;
      var fontSize = Math.round( Math.sqrt(area * maxCountrySpaceRatio / text.length));
      return Math.min(fontSize, maxFontSize); //Math.min(maxFontSize, Math.round(bounds.height / 2));
    }
  }

  function computeAreaInside(candidates) {
    var area = 0;
    candidates.forEach(function(candidate) {
      area += candidate.distance.inside;
    });

    return area;
  }

  function getBounds(points) {
    var minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY;
    var maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY;

    points.forEach(function(p) {
      if (p.x < minX)
        minX = p.x;
      if (p.y < minY)
        minY = p.y;
      if (p.x > maxX)
        maxX = p.x;
      if (p.y > maxY)
        maxY = p.y;
    });

    return {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function findRect(yOffset, rectHeight) {
    var bottomSegments = findSegmentsOnLine({
      y: yOffset,
      x: bounds.minX
    });
    var topSegments = findSegmentsOnLine({
      y: yOffset - rectHeight,
      x: bounds.minX
    });

    if (!bottomSegments.length && !topSegments.length) {
      throw new Error('yOffset is out of the range');
    }
    if (!bottomSegments.length) {
      bottomSegments = duplicateMaxRect(topSegments);
    } else if (!topSegments.length) {
      topSegments = duplicateMaxRect(bottomSegments);
    }


    var left = Math.min(bottomSegments[0].x, topSegments[0].x);
    var right = Math.max(bottomSegments[1].x, topSegments[1].x);
    if (right < left) {
      throw new Error('how right could be smaller than left?')
    }

    return {
      left: left,
      top: yOffset - rectHeight,
      width: right - left,
      height: rectHeight
    }

    function duplicateMaxRect(segments) {
      return [{
        x: segments[0].x,
        y: segments[0].y,
      }, {
        x: last(segments).x,
        y: last(segments).y
      }];
    }
  }

  function findBestCandidateIndex() {
    var bestRank = Number.NEGATIVE_INFINITY;
    var bestCandidateForLabelBase = -1;

    candidates.forEach(function(candidate, i) {
        if (candidate.rank > bestRank) {
          bestRank = candidate.rank;
          bestCandidateForLabelBase = i;
        }
    });

    return bestCandidateForLabelBase;
  }

  function normalizeDistances() {
    var maxLength = Number.NEGATIVE_INFINITY;
    candidates.forEach(function(candidate) {
      if (candidate.distance.inside > maxLength)
        maxLength = candidate.distance.inside;
    })

    candidates.forEach(function(candidate) {
      candidate.normalDistance = candidate.distance.inside / maxLength;
    });

  }

  function computeRank(candidate, idx) {
    // TODO: Looks like neighboursDistance is perfect! Remove those with 0's if not
    // needed.
    var rank = segmentLengthRank(candidate, idx) * 0 +
      distanceToMidPointRank(candidate, idx) * 0.0 +
      neighboursDistance(candidate, idx) * 1;

    candidate.rank = rank;
  }

  function neighboursDistance(candidate, idx) {
    var candidatesToConsider = 20;

    var totalLength = 0;

    for(var i = idx - candidatesToConsider; i < idx + candidatesToConsider; ++i) {
      if (i < 0 || i >= candidates.length) continue; // Assume those values 0;

      // TODO: Do I need to fade away value the further it goes?
      // var fadePenalty = Math.abs(idx - i);
      totalLength += candidates[i].normalDistance;
    }
    return totalLength/(candidatesToConsider * 2);
  }

  function segmentLengthRank(segment) {
    // return normalized distance of the land inside country
    return segment.normalDistance;
  }

  function distanceToMidPointRank(segment, idx) {
    // If point is at max distance to the midpoint - then the rank is 0;
    // If point is at min distance to the midpoint - then rank is 1;
    // So, we don't favor proximity to the borders
    var midPointDistance = Math.abs(slicesCount * 0.5 - idx)/slicesCount; // from 0 at midpoint to 0.5 at edges
    return 1 - midPointDistance * 2;
  }

  function toRankedCandidates(lineId) {
    var segments = lines[lineId];

    return {
      lineId: lineId,
      segments: segments,
      segmentsCount: segments.length,
      distance: getSegmentDistance(segments)
    };
  }

  function getSegmentDistance(points) {
    var distanceInside = 0;
    var distanceOutside = 0;

    points.forEach(function(p, idx) {
      if (idx === 0) return;

      var distance = p.x - points[idx - 1].x;
      var pointInside = (idx % 2) === 0;
      if (pointInside)
        distanceOutside += distance;
      else
        distanceInside += distance;
    });

    return {
      inside: distanceInside,
      outside: distanceOutside
    };
  }

  function appendSliceLine(point) {
    var segmentsOnLine = findSegmentsOnLine(point);
    lines[point.y] = segmentsOnLine;
  }

  function findSegmentsOnLine(point) {
    var segmentsOnLine = [];
    poly.forEachSegment(visitSegment);

    if (segmentsOnLine.length > 1) return segmentsOnLine;

    // if only one point on polygon intersects the point, there is no
    // reason to return it:
    return [];

    // Note: this can be improved by indexing points first (so that we don't have
    // O(n) during intersection search. I think it could be done in O(lg N) but
    // don't want to spend time on this yet.
    function visitSegment(from, to, fromIndex, toIndex) {
      if ((from.y < point.y && to.y < point.y) ||
        (from.y > point.y && to.y > point.y)
      ) {
        // Segment is entirely on the same side, it surely does not intersect our line
        return;
      }

      if (from.x === point.x && from.y === point.y) {
        return;
      }

      log('considering ', from, to);
      // this is our `to` case. In general, we should include it. However if this
      // point is a local extremum, we should ignore it (it means it lies on a border itself)
      if ((to.y === point.y && poly.isLocalExtremum(toIndex)) ||
        (from.y === point.y && poly.isLocalExtremum(fromIndex))
      ) {
        log('ignoring', toIndex, to, ' as it is a local extremum');
        return;
      }

      var dx = to.x - from.x;
      var dy = to.y - from.y;
      if (dy === 0) {
        log('that was parallel! ignoring');
        // this means that the segment is a horizontal line. Just take an endpoint.
        // TODO: I don't think this is correct.
        appendPointToSegment({
          x: Math.min(to.x, from.x),
          y: from.y
        });
        return;
      }

      // We know y of our horizontal line, and since two points lie on the same interval,
      // we can use slope equation to find x of a smaller point (dy/dx = dy0/dx0 =>)
      var x = from.x + (point.y - from.y) * dx / dy
      appendPointToSegment({
        x: x,
        y: point.y
      })
    }
    function appendPointToSegment(p) {
      if (pointVisited(p)) return;
      log('Adding segment at', p);

      if (segmentsOnLine.length > 0) {
        var lastSegment = last(segmentsOnLine)
        if (lastSegment.x === p.x) {
          // This can happen if we intersect a point that appears on both start
          // and end of the interval. If it was already added to the segments -
          // there is no reason to add it twice.
          log('actually no, forget about it - it is the same as the last one!');
          return;
        }
      }

      segmentsOnLine.push(p);
    }

    function pointVisited(p) {
      for (var i = 0; i < segmentsOnLine.length; ++i) {
        var segmentPoint = segmentsOnLine[i];
        if (segmentPoint.x === p.x && segmentPoint.y === p.y) return true;
      }
    }
  }

  function parsePoints(path) {
    if (path[0] !== 'M')
      throw new Error('Path should start with M');
    if (path[path.length - 1] !== 'Z')
      throw new Error('Path should end with Z');
    var largestPath = path.split('Z').sort(byLength)[0];

    return largestPath.substring(1)
      .split('L') // get all points
      .map(function(record) {
        var pair = record.split(',');
        return {
          x: parseFloat(pair[0]),
          y: parseFloat(pair[1])
        }
      });

    function byLength(x, y) {
      return y.length - x.length;
    }
  }

  function makeSlicer(bounds, slicesCount) {
    var sliceWidth = bounds.height / slicesCount;

    return {
      forEach: forEach
    }

    function forEach(callback) {
      for (var i = 0; i < slicesCount; ++i) {
        callback({
          y: bounds.minY + sliceWidth * i,
          x: bounds.minX
        }, i);
      }
    }
  }
}

function createTextMeasure(container) {
  var cachedSizes = {};

  return {
    measure: measure
  }

  function measure(text, fontSize) {
    var cacheKey = text + fontSize;
    var cachedResult = cachedSizes[cacheKey];
    if (cachedResult) return cachedResult;
    var result = {};
    cachedSizes[cacheKey] = result;

    var textContainer = sivg('text', {
      'font-size': fontSize
    });

    textContainer.innerHTML = '&nbsp;';
    container.appendChild(textContainer);

    result.space = measureText(textContainer);
    result.words = text.split(/\s/).map(function(word) {
      textContainer.text(word);
      return measureText(textContainer);
    });
    result.oneLineRect = sumUpRects(result.words, result.space);

    textContainer.innerHTML = text;
    result.preciseOneLineRect = measureText(textContainer);

    container.removeChild(textContainer);

    return result;

    function sumUpRects(rects, spaceRect) {
      var maxHeight = 0;
      var width = 0;
      rects.forEach(function(rect) {
        if (rect.height > maxHeight) maxHeight = rect.height;
        width += rect.width;
      });
      width += spaceRect.width * (rects.length - 1);
      return {
        width: width,
        height: maxHeight
      }
    }
  }
}

function measureText(svgTextElement) {
  var result = svgTextElement.getBBox();
  return {
    width: result.width,
    height: result.height
  };
}

function last(array) {
  if (array.length > 0) return array[array.length - 1];
}



function getColors() {
  var countries = getCountries();
  var colors = getColors();
  var max = 0;
  var min = Number.POSITIVE_INFINITY;
  var results = Object.keys(countries).map(key => {
      var value = countries[key];
      if (value > max) max = countries[key];
      if (value < min) min = value;

      return key;
  }).map(toColor);
  var result = Object.create(null);
  results.forEach(function(r) {
    result[r.countryName] = r.color
  })
  return result;


function toColor(countryName) {
    var value = countries[countryName] - min;
    var colorIdx = Math.round(colors.length * value/(max - min));
    if (colorIdx === colors.length) colorIdx -= 1;
    var color = colors[colors.length -1 - colorIdx]
    if (!color) {
        console.log(colors.length - colorIdx, colors.length, countryName);
    }
    return {
        countryName: countryName,
        color:color
    };
}

function getColors() {
return [
'#F5F4F2',
'#E0DED8',
'#CAC3B8',
'#BAAE9A',
'#AC9A7C',
'#AA8753',
'#B9985A',
'#C3A76B',
'#CAB982',
'#D3CA9D',
'#DED6A3',
'#E8E1B6',
'#EFEBC0',
'#E1E4B5',
'#D1D7AB',
'#BDCC96',
'#A8C68F',
'#94BF8B',
'#ACD0A5'
]
}

function getCountries() {
return { 'Afghanistan':1884,
'Albania':708,
'Algeria':800,
'Andorra':1996,
'Angola':1112,
'Antarctica':2300,
'Argentina':595,
'Armenia':1792,
'Australia':330,
'Austria':910,
'Azerbaijan':384,
'Bangladesh':85,
'Belarus':160,
'Belgium':181,
'Belize':173,
'Benin':273,
'Bhutan':3280,
'Bolivia':1192,
'Bosnia and Herzegovina':	500,
'Botswana':1013,
'Brazil':320,
'Brunei':478,
'Bulgaria':472,
'Burkina Faso':	297,
'Myanmar':702,
'Burundi':1504,
'Cambodia':126,
'Cameroon':667,
'Canada':487,
'Central African Republic':	635,
'Chad':543,
'Chile':1871,
'China':1840,
'Colombia':593,
'Republic of the Congo':430,
'Democratic Republic of the Congo':	726,
'Corsica':568,
'Costa Rica':	746,
'Croatia':331,
'Cuba':108,
'Cyprus':91,
'Czech Republic':	433,
'Denmark':34,
'Djibouti':430,
'Dominican Republic':	424,
'Ecuador':1117,
'Egypt':321,
'El Salvador':	442,
'Estonia':61,
'Equatorial Guinea':	577,
'Eritrea':853,
'Ethiopia':1330,
'Finland':164,
'France':375,
'French Guiana':	168,
'Gabon':377,
'Gambia':34,
'Georgia':1432,
'Germany':263,
'Ghana':190,
'Greece':498,
'Greenland':1792,
'Guatemala':759,
'Guinea':472,
'Guinea Bissau':	70,
'Guyana':207,
'Haiti':470,
'Honduras':684,
'Hungary':143,
'Iceland':557,
'India':160,
'Indonesia':367,
'Iran':1305,
'Iraq':312,
'Ireland':118,
'Israel':508,
'Italy':538,
'Ivory Coast':	250,
'Jamaica':340,
'Japan':438,
'Jordan':812,
'Kazakhstan':387,
'Kenya':762,
'Kuwait':108,
'Kyrgyzstan':2988,
'Latvia':87,
'Laos':710,
'Lebanon':1250,
'Lesotho':2161,
'Liberia':243,
'Libya':423,
'Lithuania':110,
'Luxembourg':325,
'Macedonia':741,
'Madagascar':615,
'Malawi':779,
'Malaysia':538,
'Maldives':1.8,
'Mali':343,
'Mauritania':276,
'Mexico':1111,
'Moldova':139,
'Mongolia':1528,
'Montenegro':1086,
'Morocco':909,
'Mozambique':345,
'Namibia':1141,
'Nepal':3265,
'Netherlands':30,
'New Zealand':	388,
'Nicaragua':298,
'Niger':474,
'Nigeria':380,
'North Korea':	400,
'Norway':460,
'Oman':310,
'Pakistan':900,
'Panama':360,
'Papua New Guinea':	667,
'Paraguay':178,
'Peru':1555,
'Philippines':442,
'Poland':173,
'Portugal':372,
'Puerto Rico':	261,
'Qatar':28,
'Romania':414,
'Rwanda':1598,
'Russia':600,
'Saudi Arabia':	665,
'Senegal':69,
'Republic of Serbia':442,
'Sierra Leone':	279,
'Slovakia': 458,
'Slovenia': 492,
'Somaliland':410,
'South Africa':	1034,
'South Korea':	282,
'Spain':660,
'Sri Lanka':	228,
'Sudan':568,
'Suriname':246,
'Swaziland':305,
'Sweden':320,
'Switzerland':1350,
'Syria':514,
'Tajikistan':3186,
'Taiwan':1150,
'United Republic of Tanzania':1018,
'Uganda': 1100,
'Thailand':287,
'Togo':236,
'Trinidad and Tobago':	83,
'Tunisia':246,
'Turkey':1132,
'Turkmenistan':230,
'Ukraine':175,
'United Arab Emirates': 149,
'United Kingdom':162,
'United States of America':759,
'Uruguay':109,
'Venezuela':450,
'Vietnam':398,
'Western Sahara': 256,
'Yemen':999,
'Zambia':1138,
'Zimbabwe':961
}
}
}
