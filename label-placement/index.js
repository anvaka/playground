/* globals sivg panzoom countries getColors getLabel */

var scene = document.getElementById('scene');
var colors = getColors();
var textLineSize = createTextMeasure(scene);

panzoom(scene);

var geometries = [];
countries.forEach(function(country, i) {
  var countryGeometry = makeCountryGeometry(country.path, country.id);
  geometries.push(countryGeometry);
  renderCountry(countryGeometry, 110, i * 110, country.id);
})

renderLabels(geometries);

function renderLabels(geometries) {
  geometries.forEach(renderPhrase);

  function renderPhrase(geometry) {
    var countryId = geometry.id;
    var text = getLabel(countryId); //testPhrase; // countryId
    var textLayout = geometry.getTextLayout(text); //countryId);

    if (!textLayout) return;

    textLayout.forEach(function(line) {
      var chunkElement = sivg('text', {
        'font-size': line.fontSize,
        x: line.x, // + (width - textWidth)/2,
        y: line.y//  - chunk.fontSize  * 0.3
      });
      chunkElement.text(line.text);
      scene.appendChild(chunkElement);
    });

    /*
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
      var textWidth = textLineSize.measure(text, chunk.fontSize).totalWidth;
      var chunkElement = sivg('text', {
        'font-size': chunk.fontSize,
        x: chunk.left + (width - textWidth)/2,
        y: chunk.bottom - chunk.fontSize  * 0.3
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
        // appendRect(start);
        // textLayout.allRectangles.north.forEach(appendRect);
        // textLayout.allRectangles.south.forEach(appendRect);
    }
    */

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
  }
}

function renderCountry(country) {
  var countryContainer = sivg('g');
  var path = country.points.map(toPath).join('L');

  countryContainer.appendChild(sivg('path', {
    id: country.id,
    fill: colors[country.id] || '#F2ECCF',
    'stroke-width': 0.3,
    'vector-effect':'non-scaling-stroke',
    stroke: '#333',
    d: 'M' + path + 'Z'
  }));

  scene.appendChild(countryContainer);
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
    var maxFontSize = 24; // TODO: Make configurable
    var fontSize = Math.max(0.1, getSuggestedFontSize(text)) + 1;

    var suggestedLayout;

    while (!suggestedLayout && fontSize > 0) {
      fontSize -= 1;
      suggestedLayout = getLayoutForFont(fontSize);
    }

    // if (suggestedLayout) {
    //   do {
    //     fontSize += 1;
    //     newLayout = getLayoutForFont(fontSize);
    //     if (newLayout) suggestedLayout = newLayout;
    //   } while (fontSize < maxFontSize && newLayout)
    // } else {
    //   do {
    //     fontSize -= 1;
    //     newLayout = getLayoutForFont(fontSize);
    //     if (newLayout) suggestedLayout = newLayout;
    //   } while (fontSize > 0 && !newLayout)
    // }


    return suggestedLayout;

    function getLayoutForFont(fontSize) {
      if (!fontSize) {
        // TODO: IMplement me. Should go 0..1 sizes
        return;
      }
      var availableLines = getAllRectanglesAtHeight(yOffset, fontSize);
      if (!availableLines.start) {
        // This means that there is no rectangle with height `fontSize` can be
        // embedded inside pologyon. Reduce the font size and try again
        return;
      }

      // split the text into words
      var input = textLineSize.measure(text, fontSize);
      var words = input.words;

      // This should give [middle], [north[0], middle], [north[0], middle, south[0]] ...
      var possibleLineLayouts = makePossibleLayouts(availableLines);

      for (var i = 0; i < possibleLineLayouts.length; ++i) {
        var lineLayout = possibleLineLayouts[i];
        var textInLineLayout = tryLineLayout(lineLayout);
        if (textInLineLayout) {
          return textInLineLayout;
        }
      }

      return null;

      function tryLineLayout(lineLayout) {
        // TODO This could be one possible optimization:
        // if (lineLayout.totalWidth < input.totalWidth) {
        //   // we know for sure, that this line layout is smaller than required
        //   // width by the text. bail out quickly.
        //   return;
        // }

        var currentLineIndex = 0;
        var currentWordIndex = 0;

        while (currentWordIndex < words.length) {
          if (currentLineIndex >= lineLayout.length) {
            // No more lines to fit the text
            return;
          }

          var currentWord = words[currentWordIndex];
          var currentLine = lineLayout[currentLineIndex];

          if (currentLine.add(currentWord)) {
            // Yay! This word fits inside this line. Move on to the next one:
            currentWordIndex += 1;
          } else if (currentLine.isEmpty()) {
            // This means that no word can fit this line, and thus the entire
            // layout doesn't fit.
            return; // TODO: should I return line index?
          } else {
            // The line is just full. Move on to the next line and retry:
            currentLineIndex += 1;
          }
        }
        // if we are here - the words can fit this line layout!
        return makeLayoutRenderer(lineLayout, fontSize);
      }
    }

    // var allRectangles = getAllRectanglesAtHeight(yOffset, fontSize);
    //
    // var rectForHeight = getRectForHeight(yOffset, fontSize);
    // var result = {
    //   removeMe: [],
    //   allRectangles: allRectangles
    // };
    //
    // if (rectForHeight) {
    //   result.removeMe = [{
    //     fontSize: fontSize,
    //     text: text,
    //     right: rectForHeight.right,
    //     left: rectForHeight.left,
    //     bottom: rectForHeight.bottom,
    //     top: rectForHeight.top
    //   }];
    // } else {
    //   // TODO: implement me. Reduce font size and retry.
    //   result.removeMe = [{
    //     fontSize: fontSize,
    //     text: text,
    //     right: bounds.maxX,
    //     left: bounds.minX,
    //     top: yOffset,
    //     bottom: yOffset + 1
    //   }];
    // }
    //
    // return result;

    function makePossibleLayouts(availableLines) {
      var lineLayouts = [];
      if (!availableLines.start) return lineLayouts;

      var totalLength = availableLines.north.length + availableLines.south.length + 1;
      var northOffset = -1;
      var southOffset = 0;

      var iterationCounter = 0;
      while (northOffset + southOffset < totalLength) {
        var layout = [];
        var i = 0;
        // add everything from north first
        for (i = northOffset; i >= 0; --i) {
          addLine(availableLines.north[i]);
        }

        // then middle
        addLine(availableLines.start);

        // then south
        for (i = 0; i < southOffset; ++i) {
          addLine(availableLines.south[i]);
        }

        // layout is ready!
        lineLayouts.push(layout)

        // increase movement so that we are alternating between north/south
        iterationCounter += 1;
        if (iterationCounter % 2 === 1) {
          northOffset += 1;
        } else {
          southOffset += 1;
        }
      }

      return lineLayouts;

      function addLine(lineRecangle) {
        if (lineRecangle) layout.push(toLine(lineRecangle));
      }
    }

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
      var maxCountrySpaceRatio = 0.45;
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
    // we need this to measure words separators.
    textContainer.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    container.appendChild(textContainer);

    result.words = text.split(/\s/).map(toWordWidths);
    result.totalWidth = sumUpWordsLengthInPixels(result.words);

    container.removeChild(textContainer);

    return result;

    function sumUpWordsLengthInPixels(words) {
      var width = 0;
      words.forEach(function(word) { width += word.width; });
      return width;
    }

    function toWordWidths(word, idx, arr) {
      var suffix = idx === arr.length - 1 ? '' : ' ';
      var wordToMeasure = word + suffix;

      textContainer.text(wordToMeasure);

      return {
        text: wordToMeasure,
        width: measureTextWidth(textContainer)
      };
    }
  }
}

function measureTextWidth(svgTextElement) {
  var result = svgTextElement.getBBox();
  return result.width;
}

function last(array) {
  if (array.length > 0) return array[array.length - 1];
}

function toLine(lineRecangle) {
  var addedWords = [];
  var lineWidth = lineRecangle.right - lineRecangle.left;
  var availableWidth = lineWidth;
  var wordsWidth = 0;

  return {
    add: add,
    isEmpty: isEmpty,
    getX: getX,
    getY: getY,
    getText: getText
  };

  function getText() {
    return addedWords.map(toWord).join('');
  }

  function toWord(wordWidth) {
    return wordWidth.text;
  }

  function getX() {
    return lineRecangle.left + (lineWidth - wordsWidth)/2;
  }

  function getY() {
    return lineRecangle.bottom;
  }

  function add(word) {
    if (availableWidth - word.width >= 0) {
      addedWords.push(word);
      availableWidth -= word.width;
      wordsWidth += word.width;

      return true;
    }
  }

  function isEmpty() {
    return addedWords.length === 0;
  }
}

function makeLayoutRenderer(lines, fontSize) {
  return {
    forEach: forEach
  };

  function forEach(callback) {
    lines.forEach(function(line) {
      if (line.isEmpty()) return;

      callback({
        fontSize: fontSize,
        text: line.getText(),
        x: line.getX(),
        y: line.getY() - fontSize * 0.3,
      });
    });
  }
}
