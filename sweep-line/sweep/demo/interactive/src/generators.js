/** TODO: How do I remove duplicates from here and perf? */
var createRandom = require('ngraph.random');
var seed = +new Date();
var prng = createRandom(seed);

export function random(count = 4, range = 100, seed) {
  if (seed !== undefined) {
    prng = createRandom(seed);
  }
  var lines = [];
  for (var i = 0; i < count; ++i) {
    lines.push({
      from: {x: (prng.nextDouble() - 0.5) * range, y: (prng.nextDouble() - 0.5) * range},
      to: {x: (prng.nextDouble() - 0.5) * range, y: (prng.nextDouble() - 0.5) * range}
    });
  }
  return lines;
}

export function triangle(count = 4, variance = 10) {
  var lines = [];
  var width = 10;
  for (var i = 0; i < count; ++i) {
    var x = prng.gaussian() * variance
    var y = prng.gaussian() * variance
    drawTriangle(x, y);
  }
  return lines;

  function drawTriangle(x, y) {
    lines.push(
      {from: {x: x, y: y}, to: {x: x + width, y}, name: `B${x},${y}`},
      {from: {x: x + width, y}, to: {x: x + width/2, y: y - width}, name: `U${x},${y}`},
      {from: {x: x + width/2, y: y - width}, to: {x, y}, name: `D${x},${y}`}
    )
  }
}

export function cube(count = 4, variance = 10) {
  var forwardAngle = 0;
  var r = 4;
  var dAngle = Math.PI/count;

  var lines = [];
  for (var i = 0; i < count; ++i) {
    forwardAngle += dAngle + prng.gaussian() * variance;
    addRect(forwardAngle, r);
    r += prng.gaussian() * variance;
  }
  return lines;

  function addRect(angle, r) {
    var x = Math.cos(angle) * r;
    var y = Math.sin(angle) * r;

    lines.push({
        from: {x: x, y: y},
        to: {x: -y, y: x},
      },
      {
        from: {x: -y, y: x},
        to: {x: -x, y: -y}
      },
      {
        from: {x: -x, y: -y},
        to: {x: y, y: -x}
      },
      {
        from: {x: y, y: -x},
        to: {x: x, y: y}
      }
    );
  }
}

export function grid(vertical = 10, horizontal = 10) {
  var lines = [];
  var dx = 0; var dy = -0.3;
  for (var i = 0; i < vertical; i += 1) {
    lines.push({
      name: 'h' + i,
      from: {x: dx, y: i + dy},
      to: {x: dx + (horizontal - 1), y: i + dy}
    });
  }

  for (i = 0; i < horizontal; i += 1) {
    lines.push({
      name: 'v' + i,
      from: {x: dx + i, y: dy},
      to: {x: dx + i, y: (vertical - 1) + dy}
    });
  }
  return lines;
}

export function drunkgrid(size = 10, variance = 10) {
  // This setup is very bad..
  // return [
  //   {
  //     "name": "v2",
  //     "from": {
  //       "x": -0.9065090071796865,
  //       "y": 15.263401779954687
  //     },
  //     "to": {
  //       "x": 14.340720330320922,
  //       "y": -2.8453003847556446
  //     },
  //     "dy": 18.108702164710333,
  //     "dx": -15.247229337500608,
  //     "angle": -0.4571069866986017
  //   },
  //   {
  //     "name": "v0",
  //     "from": {
  //       "x": 7.0121826553229045,
  //       "y": 6.51578380772819
  //     },
  //     "to": {
  //       "x": -14.33942114543839,
  //       "y": 6.5156799042713605
  //     },
  //     "dy": 0.00010390345682953495,
  //     "dx": 21.351603800761296,
  //     "angle": 0.9999951337167842
  //   },
  //   {
  //     "name": "v1",
  //     "from": {
  //       "x": -7.166517787738302,
  //       "y": 10.160876487964895
  //     },
  //     "to": {
  //       "x": 9.088398499652495,
  //       "y": -15.20648970096957
  //     },
  //     "dy": 25.367366188934465,
  //     "dx": -16.2549162873908,
  //     "angle": -0.3905339957422227
  //   },
  // ]
  var lines = [];
  var dx = -2 * variance; var dy = -2 * variance;
  for (var i = 0; i < size; i += 1) {
    lines.push({
      name: 'h' + i,
      from: {x: dx + prng.gaussian() * variance, y: i + dy + prng.gaussian() * variance},
      to: {x: dx + (size - 1) + prng.gaussian() * variance, y: i + dy + prng.gaussian() * variance}
    });
    lines.push({
      name: 'v' + i,
      from: {x: dx + i + prng.gaussian() * variance, y: dy + prng.gaussian() * variance},
      to: {x: dx + i + prng.gaussian() * variance, y: (size - 1) + dy + prng.gaussian() * variance}
    });
  }

  return lines;
}

export function complete(count = 10, range = 100) {
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
