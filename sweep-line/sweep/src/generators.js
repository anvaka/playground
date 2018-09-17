export function getCircularLines(count = 10, range = 100) {
  var angleStep = 2*Math.PI / count;
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
          start: {x: x, y: y},
          end: {x: ex, y: ey}
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
