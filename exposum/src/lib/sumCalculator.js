const cyclicArray = require("./cyclicArray");

const {useDecimal} = require('./config');
const Decimal = require('decimal.js');

const PI_2 = useDecimal ? Decimal.acos(-1).times(2) : Math.PI * 2;

module.exports = sumCalculator;

function sumCalculator(options) {
  let points = cyclicArray(options.totalSteps || 10000);
  points.push({x: 0, y: 0});
  const getNextPoint = useDecimal ? getNextDecimalPoint : getNextFloatPoint;

  let rafHandle;
  let n = 1;
  let dn = options.stepsPerIteration;
  let sumLimit = options.totalSteps;
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
    getPoints: () => points,
    isDone() { return n >= sumLimit; }
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
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (n < sumLimit) rafHandle = requestAnimationFrame(frame);
  }

  function getNextDecimalPoint(n) {
    const phi = next(n).times(PI_2);
    px += Number(phi.cos());
    py += Number(phi.sin());

    return {x: px, y: py}
  }

  function getNextFloatPoint(n) {
    const phi = next(n) * PI_2;
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