const {useDecimal} = require('./config');
const sumCalculator = require('./sumCalculator.js');
const createScene = require('./scene');
const {parse} = require('../js-arithmetics');

const Decimal = require('decimal.js');
Decimal.set({ precision: 100, rounding: 8 })
window.Decimal = Decimal;

var defaultCode = useDecimal ? `function f(k) {
  return (new Decimal(k)).div(3);
}` : `x / 3`;

const scene = createScene();

var code = {
  code: defaultCode,
  error: null,
  isImmediate: false,
  setCode(newCode, immediate) {
    var newNext = compileNextFunction(newCode);
    if (!newNext) return; // error

    code.error = null;
    code.code = newCode;

    generatorOptions.next = newNext;

    if (immediate) {
      const newSumCalculator = sumCalculator(generatorOptions);
      scene.setSumCalculator(newSumCalculator);
    } else if (!code.immediate) {
      scene.redrawCurrentPoints();
    }
    code.immediate = immediate;
  }
}

var generatorOptions = {
  next: compileNextFunction(defaultCode),
  bufferSize: 90000,
  stepsPerIteration: 500,
  totalSteps: 3000000,
};

var appState = {
  code,

  getLineColor() { return scene.getLineColor() },
  setLineColor(r, g, b, a) { 
    scene.setLineColor(r, g, b, a);
  },
  getFillColor() { return scene.getClearColor(); },
  setFillColor(r, g, b, a) {
    scene.setClearColor(r, g, b, a);
  },
  getTotalSteps() { return generatorOptions.totalSteps; },
  setTotalSteps(newValue) {
    generatorOptions.totalSteps = getNumber(newValue, generatorOptions.totalSteps);
    scene.restartCalculator();
  },

  getBufferSize() { return generatorOptions.bufferSize; },
  setBufferSize(newValue) {
    generatorOptions.bufferSize = getNumber(newValue, generatorOptions.bufferSize);
    scene.restartCalculator();
  },

  getStepsPerIteration() { return generatorOptions.stepsPerIteration; },
  setStepsPerIteration(newValue) { 
    generatorOptions.stepsPerIteration = getNumber(newValue, generatorOptions.stepsPerIteration);
    scene.redrawCurrentPoints()
  },

  settingsPanel: {
    collapsed: true
  },
}

module.exports = appState


function getNumber(str, defaultValue) {
  var parsed = Number.parseFloat(str);
  if (Number.isNaN(parsed)) return defaultValue;
  return parsed;
}


function compileNextFunction(newCode) {
  try {
    console.log('compiling ' + newCode);
    const compiledCode = parse(newCode);
    var creator = new Function(`function f(x) {
  return ${compiledCode};
}
return f;`);
    var next = creator();
    next(0); // just a test.
    return next;
  } catch (e) {
    code.error = e.message;
    code.location = e.location && e.location.start;
    console.error(e);
    return null;
  }
}
