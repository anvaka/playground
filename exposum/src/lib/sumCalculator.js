const {useDecimal} = require('./config');
const Decimal = require('decimal.js');

const PI_2 = useDecimal ? Decimal.acos(-1).times(2) : Math.PI * 2;

module.exports = sumCalculator;

function sumCalculator(options) {
  let frameCallback = Function.prototype;
  let rafHandle;

  const getNextPoint = useDecimal ? getNextDecimalPoint : getNextFloatPoint;

  let next;
  let currentStep;
  let maxTotalSteps;
  let px, py;
  let box;

  reset();

  return {
    stop,
    reset,
    run,
    getOptions() {
      return options;
    },
    getBoundingBox: () => box,
    getPoints: () => points,
    isDone() { return currentStep >= maxTotalSteps; },
    getCurrentStep() { return currentStep; },
    getTotalSteps() { return maxTotalSteps; }
  }

  function initialBoundingBox() {
    return {
      minX: 0, maxX: 0,
      minY: 0, maxY: 0
    };
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
    currentStep = 1;
    maxTotalSteps = options.totalSteps;
    px = useDecimal ? Decimal(0) : 0; 
    py = useDecimal ? Decimal(0) : 0;
    
    box = initialBoundingBox();
  }

  function frame() {
    let added = []
    let frameSteps = 0;
    while (currentStep < maxTotalSteps && frameSteps < options.stepsPerIteration) {
      let pt = getNextPoint(currentStep);
      pt.y = -pt.y;
      extendBoundingBoxIfNeeded(pt.x, pt.y);
      added.push(pt);
      currentStep += 1;
      frameSteps += 1;
    }

    frameCallback(added);
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (currentStep < maxTotalSteps) rafHandle = requestAnimationFrame(frame);
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