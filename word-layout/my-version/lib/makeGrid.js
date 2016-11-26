module.exports = makeGrid;
var randomAPI = require('ngraph.random');
var random = randomAPI.random(42);

function makeGrid(mask) {
  var width = mask.width;
  var height = mask.height

  var integralSum = new Uint32Array(width * height)

  recomputeIntegral(0, 0);

  var api = {
    findSpot: findSpot,
    useSpot: useSpot,
    mask: mask
  }

  return api;

  function findSpot(wordBox) {
    var searchWidth = width - wordBox.width;
    var searchHeight = height - wordBox.height;
    var spots = [];

    var padding = 1;
    for (var x = 0; x < searchWidth; ++x) {
      for (var y = 0; y < searchHeight; ++y) {
        var takenArea = integral(x - 1 - padding, y - 1 - padding, wordBox.width + padding * 2, wordBox.height + padding * 2);

        if (takenArea === 0) {
          spots.push({x: x, y: y});
        }
      }
    }

    if (spots.length > 0) {
      var candidate = spots[random.next(spots.length)];
      return {
        x: candidate.x,
        y: candidate.y,
        width: wordBox.width,
        height: wordBox.height,
        originalHeight: wordBox.originalHeight,
        mask: wordBox.mask
      };
    }
  }

  function useSpot(spot) {
    // just make it all blank
    var maxX = spot.x + spot.width;
    var maxY = spot.y + spot.originalHeight;
    var occupied = mask.occupied;

    for (var x = spot.x; x < maxX; ++x) {
      for (var y = spot.y; y < maxY; ++y) {
        var idx = getIdx(x, y);
        var ox = x - spot.x;
        var oy = y - spot.y;
        var shouldBeOccupied = spot.mask[oy * spot.width + ox]
        if (occupied[idx] && shouldBeOccupied) throw new Error('Already taken!')
        else if (shouldBeOccupied) {
          occupied[idx] = shouldBeOccupied;
        }
      }
    }

    recomputeIntegral(spot.x - 1, spot.y - 1);
  }

  function recomputeIntegral(minX, minY) {
    var occupied = mask.occupied;
    for (var x = minX; x < width; ++x) {
      for (var y = minY; y < height; ++y) {
        var i = get(occupied, x, y) + get(integralSum, x - 1, y) + get(integralSum, x, y - 1) - get(integralSum, x - 1, y - 1);
        integralSum[getIdx(x, y)] = i;
      }
    }
  }

  function integral(x, y, width, height) {
    // https://en.wikipedia.org/wiki/Summed_area_table
    var area = get(integralSum, x, y) + get(integralSum, x + width, y + height);
    area -= get(integralSum, x + width, y) + get(integralSum, x, y + height);

    return area;
  }

  function get(buffer, x, y) {
    if (x > width || x < 0) return 0;
    if (y > height || y < 0) return 0;

    return buffer[getIdx(x, y)];
  }

  function getIdx(x, y) {
    return y * width + x
  }
}

