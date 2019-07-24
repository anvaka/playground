module.exports = expoSum;

const SUM_LIMIT = 10000;
const PI_2 = Math.PI * 2;

function cyclicArray(maxSize) {
  let points = [];
  let startFrom = 0;
  return {
    push,
    forEach,
    get length() {
      return points.length
    }
  }

  function push(point) {
    if (points.length >= maxSize) {
      points[startFrom] = point;
      startFrom += 1;
      if (startFrom === maxSize) startFrom = 0;
    } else {
      points.push(point);
    }
  }

  function forEach(callback) {
    let index = startFrom;
    let visited = 0;

    while (visited < points.length) {
      callback(points[index], index);
      index += 1;
      visited += 1

      if (index === maxSize) index = 0;
    }
  }
}

function expoSum(options) {
  let points = cyclicArray(10000);
  points.push({x: 0, y: 0});

  let rafHandle;
  let n = 1;
  let dn = options.stepsPerIteration;
  let next = options.next;
  let px = 0, py = 0;

  let box = {
    minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY
  };

  return {
    dispose,
    run,
    evaluateBoundingBox,
    getBoundingBox: () => box,
    getPoints: () => points
  }

  function resetBoundingBox() {
    box.minX = Number.POSITIVE_INFINITY; 
    box.maxX = Number.NEGATIVE_INFINITY;
    box.minY = Number.POSITIVE_INFINITY;
    box.maxY = Number.NEGATIVE_INFINITY;

    points.forEach((pt) => {
      extendBoundingBoxIfNeeded(pt.x, pt.y);
    });
  };

  function evaluateBoundingBox() {
    px = 0;
    py = 0;
    // resetBoundingBox();
    for (let i = 0; i < 100; ++i) {
      let pt = getNextPoint(i);
      extendBoundingBoxIfNeeded(pt.x, pt.y);
    }
    px = 0;
    py = 0;
  }

  function run() {
    rafHandle = requestAnimationFrame(frame);
  }

  function dispose() {
    cancelAnimationFrame(rafHandle);
  }

  function frame() {
    // resetBoundingBox();
    let i = 0;
    while (i < dn) {
      let pt = getNextPoint(n);
      extendBoundingBoxIfNeeded(pt.x, pt.y);
      points.push(pt);
      i += 1;
      n += 1;
    }
    options.onFrame(points);
    if (n < SUM_LIMIT) rafHandle = requestAnimationFrame(frame);
  }

  function getNextPoint(n) {
    const phi = PI_2 * next(n);
    px += Math.cos(phi);
    py += Math.sin(phi);

    return {x: px, y: py}
  }

  function extendBoundingBoxIfNeeded(px, py) {
    if (px < box.minX) box.minX = px;
    if (px > box.maxX) box.maxX = px;
    if (py < box.minY) box.minY = py;
    if (py > box.maxY) box.maxY = py;
  }
}