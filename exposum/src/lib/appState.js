const {useDecimal} = require('./config');
const sumCalculator = require('./sumCalculator.js');
const createScene = require('./scene');

const Decimal = require('decimal.js');
window.Decimal = Decimal;

var defaultCode = useDecimal ? `function f(k) {
  return (new Decimal(k)).div(3);
}` : `function f(k) {
  return k / 3;
}`;

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
  stepsPerIteration: 10,
  totalSteps: 20000,
};

var appState = {
  code,

  getTotalSteps() { return generatorOptions.totalSteps; },
  setTotalSteps(newValue) {
    generatorOptions.totalSteps = getNumber(newValue, generatorOptions.totalSteps);
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

function compileNextFunction(code) {
  try {
    var creator = new Function(code + '\nreturn f;');
    var next = creator();
    next(0); // just a test.
    return next;
  } catch (e) {
    code.error = e.message;
    console.error(e);
    return null;
  }
}
