var createRandom = require('ngraph.random');
// var seed = +new Date();
var seed = 1536687392180
var random = createRandom(seed);

export function getRandomLines(count = 4, range = 100) {
  var lines = [];
  for (var i = 0; i < count; ++i) {
    lines.push({
      from: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range},
      to: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range}
    });
  }
  return lines;
}

export function getGridLines(vertical = 10, horizontal = 10, step = 1) {
  var lines = [];
  var dx = 0; var dy = -0.3;
  for (var i = 0; i < vertical; i += 1) {
    lines.push({
      from: {x: dx, y: i * step + dy},
      to: {x: dx + (vertical - 1)* step, y: i * step + dy}
    });
  }
  for (i = 0; i < horizontal; i += 1) {
    lines.push({
      from: {x: dx + i * step, y: dy},
      to: {x: dx + i * step, y: (horizontal - 1) * step + dy}
    });
  }
  return lines;
}

export function getCircularLines(count = 10, range = 100) {
  var angleStep = 2 * Math.PI / count;
  var lines = [];
  var seen = new Set();

  for (var i = 0; i < count; ++i) {
    var angle = angleStep * i;
    var x = Math.cos(angle) * range / 2;
    var y = Math.sin(angle) * range / 2;
    for (var j = 0; j < count; ++j) {
      if (j !== i) {
        var ex = Math.cos(angleStep * j) * range / 2;
        var ey = Math.sin(angleStep * j) * range / 2;
        var name = `${i},${j}`;
        var l = {
          name: name,
          from: {x: x, y: y},
          to: {x: ex, y: ey}
        };
        var sKey = getKey(i, j);
        if (!seen.has(sKey)) {
          lines.push(l);
          seen.add(sKey)
        }
      }
    }
  }

  return lines;

  function getKey(i, j) {
    return i < j ? i + ';' + j : j + ';' + i;
  }
}
