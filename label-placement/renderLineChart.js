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
