module.exports = expoSum;

function expoSum(options) {
  let points = [{x: 0, y: 0}];
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
    forEachPoint,
    evaluateBoundingBox,
    getBoundingBox: () => box
  }

  function evaluateBoundingBox() {
    px = 0;
    py = 0;
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
    let i = 0;
    while (i < dn) {
      let pt = getNextPoint(n);
      extendBoundingBoxIfNeeded(pt.x, pt.y);
      points.push(pt);
      i += 1;
      n += 1;
    }
    options.onFrame(points);
    rafHandle = requestAnimationFrame(frame);
  }

  function getNextPoint(n) {
    const phi = Math.PI * 2 * next(n);
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

  function forEachPoint(callback) {

  }
}