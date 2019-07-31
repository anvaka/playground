const cyclicArray = require("./cyclicArray");

const {useDecimal} = require('./config');
const Decimal = require('decimal.js');

const PI_2 = useDecimal ? Decimal.acos(-1).times(2) : Math.PI * 2;

module.exports = sumCalculator;

function sumCalculator(options) {
  let frameCallback = Function.prototype;
  let rafHandle;

  let points;
  const getNextPoint = useDecimal ? getNextDecimalPoint : getNextFloatPoint;

  let next;
  let n;
  let dn;
  let sumLimit;
  let px, py;
  let box;

  reset();

  return {
    stop,
    reset,
    run,
    evaluateBoundingBox,
    getOptions() {
      return options;
    },
    getBoundingBox: () => box,
    getPoints: () => points,
    isDone() { return n >= sumLimit; }
  }

  function initialBoundingBox() {
    return {
      minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY
    };
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
    px = useDecimal ? Decimal(0) : 0; 
    py = useDecimal ? Decimal(0) : 0;
    dn = options.stepsPerIteration;
    // resetBoundingBox();
    for (let i = 0; i < 100; ++i) {
      let pt = getNextPoint(i);
      extendBoundingBoxIfNeeded(pt.x, pt.y);
    }
    px = useDecimal ? Decimal(0) : 0; 
    py = useDecimal ? Decimal(0) : 0;
  }

  function run(newFrameCallback) {
    frameCallback = newFrameCallback;
    rafHandle = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(rafHandle);
  }

  function reset() {
    next = options.next;
    n = 1;
    dn = options.stepsPerIteration;
    sumLimit = options.totalSteps;
    px = useDecimal ? Decimal(0) : 0; 
    py = useDecimal ? Decimal(0) : 0;
    
    box = initialBoundingBox();
    points = cyclicArray(options.totalSteps);
    points.push({x: 0, y: 0});
  }

  function frame() {
    // resetBoundingBox();
    let i = 0;
    let added = []
    while (i < dn) {
      let pt = getNextPoint(n);
      extendBoundingBoxIfNeeded(pt.x, pt.y);
      // points.push(pt);
      added.push(pt);
      i += 1;
      n += 1;
    }

    frameCallback(points, added);
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (n < sumLimit) rafHandle = requestAnimationFrame(frame);
  }

  function getNextDecimalPoint(n) {
    const phi = next(n).times(PI_2);
    px = px.plus(phi.cos());
    py = py.plus(phi.sin());

    return {x: Number(px), y: Number(py)}
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