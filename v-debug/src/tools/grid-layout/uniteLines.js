const threshold = 5;
export default function uniteLines(lines) {
  lines.forEach(line => {
    lines.forEach(other => {
      if (line === other) return;

      update(line, other, 'from', 'from');
      update(line, other, 'from', 'to');
      update(line, other, 'to', 'from');
      update(line, other, 'to', 'to');
    });
  });
}

function update(a, b, aProp, bProp) {
  // const aMoveKey = aProp + 'Moved';
  // if (a[aMoveKey]) return;

  // const bMoveKey = bProp + 'Moved';
  // if (b[bMoveKey]) return;

  var aPos = a[aProp];
  var bPos = b[bProp];
  if (length(aPos, bPos) < threshold) {
    // a[aMoveKey] = true;
    // b[bMoveKey] = true;

    var newPoint = midPoint(aPos, bPos)
    a[aProp] = newPoint;
    b[bProp] = newPoint;
  }
}

function midPoint(a, b) {
  return {
    x: (a.x + b.x)/2,
    y: (a.y + b.y)/2,
  }
}

function length(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}