/* globals sivg panzoom countries */

// var simplePoints = simplify(points);
var scene = document.getElementById('scene');
panzoom(scene);

countries.forEach(function(country, i) {
  var countryGeometry = makeCountryGeometry(country.path);
  renderLineChart(countryGeometry, 0, i * 110, country.id);
  renderCountry(countryGeometry, 110, i * 110, country.id);

})

// outlineIntersections(countryGeometry.candidates);

function emptyCandidates(candidate) {
  return candidate.segments.length > 1;
}

function renderCountry(country, gdx, gdy, countryId) {
  var bounds = country.bounds;
  var dx = bounds.maxX - bounds.minX;
  var dy = bounds.maxY - bounds.minY;
  var scaler = Math.max(dx, dy);

  var countryContainer = sivg('g');
  var path = country.points.map(toZero).map(toPath).join('L');
  countryContainer.appendChild(sivg('path', {
    fill: '#F2ECCF',
    d: 'M' + path + 'Z'
  }))

  scene.appendChild(countryContainer);
  var name = sivg('text', {
    x: gdx + 110,
    y: gdy + 50,
    'font-size': 18,
  });
  name.text(countryId);
  scene.appendChild(name);

  function toZero(p) {
    return {
      x: (p.x - bounds.minX) * 100 / scaler + gdx,
      y: (p.y - bounds.minY) * 100 / scaler + gdy
    };
  }
}

function getSegmentDistance(points) {
  var distanceInside = 0;
  var distanceOutside = 0;

  points.forEach(function(p, idx) {
    if (idx === 0) return;

    var distance = p.x - points[idx - 1].x;
    var pointInside = (idx % 2) === 0;
    if (pointInside) distanceOutside += distance;
    else distanceInside += distance;
  });

  return {
    inside: distanceInside,
    outside: distanceOutside
  };
}


function polyLine(points) {
  // sort by x, so that we know when line enters/quits.
  var sortedSegmentIndices = points.map(function(_, i) { return i; })
    .sort(function (firstSegmentIndex, secondSegmentIndex) {
      var a = getSegment(firstSegmentIndex);
      var b = getSegment(secondSegmentIndex);

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
      if (to === points.length) to = 0; // loop the last point
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
    if (p.x < minX) minX = p.x;
  });

  return {
    x: x/points.length,
    y: y/points.length,
    minX: minX
  }
}


function parseFloat(x) {
  var result = Number.parseFloat(x);
  if (Number.isNaN(result)) throw new Error(x + ' is not a number');

  return result
}

function log() {
  return;
  console.log.apply(console, arguments);
}

function moveToZero(points) {
  var bounds = getBounds(points);
  return points.map(translate(-bounds.minX, -bounds.minY));
}

function translate(x, y) {
  return function(p) {
    return {
      x: p.x + x,
      y: p.y + y
    };
  }
}

function getBounds(points) {
  var minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY;
  var maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;

  points.forEach(function (p) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY
  };
}

function renderLineChart(country, dx, dy, name) {
  var maxY = Number.NEGATIVE_INFINITY;
  var candidates = country.candidates;
  var bounds = country.bounds;
  var countryWidth = bounds.maxX - bounds.minX;
  var countryHeight = bounds.maxY - bounds.minY;
  var scaleY = 100;// * (bounds.maxY - bounds.minY)/scaler;
  if (countryHeight < countryWidth) {
   scaleY /= countryHeight / countryWidth;
  }
  var totalLength = 0;
  var bestCandidateForLabelBase = 0;
  var bestLength = Number.NEGATIVE_INFINITY;

  var chartPoints = candidates.map(function(candidate, i) {
    var y = candidate.distance.inside;
    if (y > maxY) maxY = y;
    totalLength += y;

    var midPointDistance = Math.abs(50 - i);
    var rank = 1 - 0.5 * midPointDistance / 50;
    var rankedLength = y * rank;
    if (rankedLength > bestLength) {
      bestLength = rankedLength;
      bestCandidateForLabelBase = i;
    }

    return { y: i, x: y }
  });
  console.log(name, totalLength/100);

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
        x: dx + point.x * 100/maxY,
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
  })
}

function makeCountryGeometry(countryPath) {
  var points = parsePoints(countryPath);
  var bounds = getBounds(points);
  var slicer = makeSlicer(bounds, 100);

  var poly = polyLine(points);
  var lines = {};
  slicer.forEach(appendSliceLine)
  var candidates = Object.keys(lines).map(toRankedCandidates).filter(emptyCandidates);

  return {
    bounds: bounds,
    candidates: candidates,
    points: points
  };

function toRankedCandidates(lineId) {
  var segments = lines[lineId];
  return {
    lineId: lineId,
    segments: segments,
    segmentsCount: segments.length,
    distance: getSegmentDistance(segments)
  };
}

function appendSliceLine(point) {
    var segmentsOnLine = [];
    lines[point.y] = segmentsOnLine

    // Note: this can be improved by indexing points first.
    poly.forEachSegment(function(from, to, fromIndex, toIndex) {
      if((from.y < point.y && to.y < point.y) ||
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
        appendPointToSegment({ x: Math.min(to.x, from.x), y: from.y });
        return;
      }

      // We know y of our horizontal line, and since two points lie on the same interval,
      // we can use slope equation to find x of a smaller point (dy/dx = dy0/dx0 =>)
      var x = from.x + (point.y - from.y) * dx/dy
      appendPointToSegment({ x: x, y: point.y })
    });

    function appendPointToSegment(p) {
      if (pointVisited(p)) return;
      log('Adding segment at', p);

      if (segmentsOnLine.length > 0) {
        var lastSegment = segmentsOnLine[segmentsOnLine.length - 1];
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
  if (path[0] !== 'M') throw new Error('Path should start with M');
  if (path[path.length - 1] !== 'Z') throw new Error('Path should end with Z');
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
  var sliceWidth = (bounds.maxY - bounds.minY)/slicesCount;

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

function byRank(a, b) {
  return (b.distance.inside) - (a.distance.inside);
  // TODO: Rank it by number of segments, proximity to center, proximity to border?

  // var segmentsDiff = a.segmentsCount - b.segmentsCount;
  // return segmentsDiff;
}
}
