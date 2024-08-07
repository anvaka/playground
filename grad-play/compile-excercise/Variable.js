import { getTopologicalOrder } from './getTopologicalOrder.js';

const emptySet = new Set();

export class NS {
  constructor() {
    this.lastUsed = 0;
    this.lastUsedFunction = 0;
    this.dtype = 'Float64Array'
    this.functionCallbacks = [];
    this.setGradientCallbacks = [];

    // Variable values used in the forward pass. Initialized in `compile()`
    this.v = null;

    // Variable computed gradients are stored here in backward pass. 
    // Initialized in `compile()`
    this.gv = null;

    const notCompiled = () => {throw new Error('Not compiled')};
    // Executes forward pass using currently stored variables in `this.v`
    this.forward = notCompiled;

    // Executes backward pass using currently stored variables in `this.gv`
    this.backward = notCompiled;
  }

  isCompiled() {
    return this.v !== null && this.gv !== null;
  }

  allocateSpace() {
    let name = this.lastUsed;
    this.lastUsed++;
    return name;
  }

  // TODO: Don't use this. Likely it will be removed.
  allocateFunctionSpace(functionCallback, setGradientCallback) {
    this.functionCallbacks.push(functionCallback);
    this.setGradientCallbacks.push(setGradientCallback);
    return this.functionCallbacks.length - 1;
  }

  getVariableNameForId(id) {
    return `v[${id}]`;
  }

  getGradientNameForId(id) {
    return `gv[${id}]`;
  }

  compile(startNode) {
    // TODO: Check if compiled and throw?
    let traversalOrder = getTopologicalOrder(startNode);
    let forwardCode = [];
    let backwardCode = [];
    for (let i = traversalOrder.length - 1; i >= 0; i--) {
      // for the forward pass we want to visit all leaves first
      let node = traversalOrder[i];
      if (node.forwardCode) forwardCode.push(node.forwardCode);

      // backward pass is done in reverse order (parents first)
      let backNode = traversalOrder[traversalOrder.length - 1 - i];
      if (backNode.backwardCode) backwardCode.push(backNode.backwardCode);
    }
    // this.forwardCode = forwardCode.join('\n');
    let code = `
var v = new ${this.dtype}(${this.lastUsed});
var gv = new ${this.dtype}(${this.lastUsed});

function forward() {
  ${forwardCode.join('\n  ')}
}

function backward() {
  ${backwardCode.join('\n  ')}
}

return {
  forward: forward,
  backward: backward,
  v: v,
  gv: gv
}
`
    let result = new Function(code)();

    Object.assign(this, result);
    // `Object.assign()` is the same as:
    // 
    // this.v = result.v;
    // this.gv = result.gv;
    // this.forward = result.forward;
    // this.backward = result.backward;

    if (!this.isCompiled()) {
      // Just a sanity check
      throw new Error('Failed to compile');
    }
  }
}

export class BaseVariable {
  constructor(ns, children) {
    this.ns = ns;
    this.children = children || emptySet;
    this.parentCount = 0; // we use this for non-recursive topological sort
    this.forwardCode = null;
    this.backwardCode = null;
    this.id = ns.allocateSpace();
    this.name = ns.getVariableNameForId(this.id);
    this.gradName = ns.getGradientNameForId(this.id);
  }

  forwardPass() {
    this.ns.forward();
  }

  backwardPass() {
    this.ns.backward();
  }

  compile() {
    if (this.ns.isCompiled()) return;
    this.ns.compile(this);
  }

  setBackwardCode(code) {
    this.backwardCode = code;
  }

  setForwardCode(code) {
    this.forwardCode = code;
  }

  getDot(options) {
    let nodes = getTopologicalOrder(this);
    let dot = ['digraph G {']
    let isCompiled = this.ns.isCompiled();
    let formatValue = (options && options.formatValue) || (v => v.toFixed(2));
    let formatGradient = (options && options.formatGradient) || (v => '| ' + v.toFixed(2));

    nodes.forEach((node, i) => {
      node.graphId = i;
      let nodeAttributes = isCompiled ? 
        `[label="${node.uiName}\\n${formatValue(node.getValue())} ${formatGradient(node.getGradient())}"]` : `[label="${node.uiName}"]`;
      dot.push(`${node.graphId} ${nodeAttributes}`);
    });
    let edges = new Set()
    nodes.forEach(node => {
      node.children.forEach(child => {
        let edgeId = node.graphId + '_' + child.graphId;
        if (edges.has(edgeId)) return;
        edges.add(edgeId);
        dot.push(`${node.graphId} -> ${child.graphId}`);
      });
    });
    dot.push('}');
    return dot.join('\n');
  }
}

export class ReferenceVariable extends BaseVariable {
  constructor(ns, children) {
    super(ns, children);
    this.uiName = 'Ref(var)'

    // Instead of storying the value in memory, we store the id of the variable
    // to which we point. This changes how the variable is accessed
    this.name = `v[v[${this.id}]]`;
    this.gradName = `gv[v[${this.id}]]`;
  }

  setReference(value) {
    this.ns.v[this.id] = value.id;
  }

  getValue() {
    let v = this.ns.v;
    return v[v[id]];
  }

  setValue(value) {
    let v = this.ns.v;
    v[v[this.id]] = value;
  }
}

export class Variable extends BaseVariable {
  constructor(ns, children, uiName) {
    super(ns, children);
    this.uiName = uiName;
  }

  get value() {
    return this.ns.v[this.id];
  }

  set value(x) {
    this.ns.v[this.id] = x;
  }

  get gradient() {
    return this.ns.gv[this.id];
  }

  set gradient(x) {
    this.ns.gv[this.id] = x;
  }

  setValue(value) {
    if (!this.ns.isCompiled()) throw new Error('Variable not compiled');
    this.ns.v[this.id] = value;
  }

  getValue() {
    if (!this.ns.isCompiled()) throw new Error('Variable not compiled');
    return this.ns.v[this.id];
  }

  setGradient(value) {
    if (!this.ns.isCompiled()) throw new Error('Variable not compiled');
    return this.ns.gv[this.id] = value;
  }

  getGradient() {
    if (!this.ns.isCompiled) throw new Error('Variable not compiled');
    return this.ns.gv[this.id];
  }

  gradientStep(learningRate) {
    // todo: need clamping?
    this.ns.v[this.id] -= learningRate * this.ns.gv[this.id];
  }
  
  // These are mathematical functions, add yours.
  add(other) {
    if (other instanceof BaseVariable) {
      let result = new Variable(this.ns, new Set([this, other]), '+');
      result.setForwardCode(`${result.name} = ${this.name} + ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${result.gradName}; ${other.gradName} += ${result.gradName}`
      )
      return result;
    }
    if (Number.isNaN(other)) {
      throw new Error('Cannot add NaN');
    }

    let safeValue = Number.parseFloat(other);
    let result = new Variable(this.ns, new Set([this]), `+ ${safeValue}`);

    result.setForwardCode(`${result.name} = ${this.name} + ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName};`)
    return result;
  }

  sub(other) {
    if (other instanceof BaseVariable) {
      let result = new Variable(this.ns, new Set([this, other]), '-');
      result.setForwardCode(`${result.name} = ${this.name} - ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${result.gradName}; ${other.gradName} -= ${result.gradName}`
      )
      return result;
    }
    if (Number.isNaN(other)) {
      throw new Error('Cannot sub NaN');
    }

    let safeValue = Number.parseFloat(other);
    let result = new Variable(this.ns, new Set([this]), `- ${safeValue}`);

    result.setForwardCode(`${result.name} = ${this.name} - ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName};`)
    return result;
  }

  mul(other) {
    if (other instanceof BaseVariable) {
      let result = new Variable(this.ns, new Set([this, other]), '*');
      result.setForwardCode(`${result.name} = ${this.name} * ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${other.name} * ${result.gradName}; ${other.gradName} += ${this.name} * ${result.gradName}`
      )
      return result;
    } 
    if (Number.isNaN(other)) {
      throw new Error('Cannot multiply by NaN');
    }

    let safeValue = Number.parseFloat(other);
    let result = new Variable(this.ns, new Set([this]), '* ' + safeValue);

    result.setForwardCode(`${result.name} = ${this.name} * ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${safeValue} * ${result.gradName};`)
    return result;
  }

  div(other) {
    if (other instanceof BaseVariable) {
      let result = new Variable(this.ns, new Set([this, other]), '/');
      result.setForwardCode(`${result.name} = ${this.name} / ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${result.gradName} / ${other.name}; ` +
        `${other.gradName} -= ${this.name} * ${result.gradName} / (${other.name} * ${other.name});`
      );
      return result;
    }
    if (Number.isNaN(other)) {
      throw new Error('Cannot divide by NaN');
    }
    let safeValue = Number.parseFloat(other);
    let result = new Variable(this.ns, new Set([this]), '/ ' + safeValue);

    result.setForwardCode(`${result.name} = ${this.name} / ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} / ${safeValue};`);
    return result;
  }

  pow(degree) {
     if (degree instanceof BaseVariable) {
      let result = new Variable(this.ns, new Set([this, degree]), '^');
      result.setForwardCode(`${result.name} = Math.pow(${this.name}, ${degree.name});`);
      // https://www.wolframalpha.com/input/?i=partial+derivative+of+a+%5Eb
      result.setBackwardCode(
        `${this.gradName} += ${degree.name} * Math.pow(${this.name}, ${degree.name} - 1) * ${result.gradName}; ` + 
        `${degree.gradName} += ${result.name} * Math.log(${this.name}) * ${result.gradName};`
      )
      return result;
    }
    if (Number.isNaN(degree)) {
      throw new Error('Cannot pow NaN');
    }

    let safeValue = Number.parseFloat(degree);
    let result = new Variable(this.ns, new Set([this]), '^ ' + safeValue);

    result.setForwardCode(`${result.name} = Math.pow(${this.name}, ${safeValue});`);
    result.setBackwardCode(`${this.gradName} += ${safeValue} * Math.pow(${this.name}, ${safeValue} - 1) * ${result.gradName};`);
    return result;
  }

  sin() {
    let result = new Variable(this.ns, new Set([this]), 'sin()');
    result.setForwardCode(`${result.name} = Math.sin(${this.name});`);
    result.setBackwardCode(`${this.gradName} += Math.cos(${this.name}) * ${result.gradName};`);
    return result;
  }

  cos() {
    let result = new Variable(this.ns, new Set([this]), 'cos()');
    result.setForwardCode(`${result.name} = Math.cos(${this.name});`);
    result.setBackwardCode(`${this.gradName} -= Math.sin(${this.name}) * ${result.gradName};`);
    return result;
  }

  abs() {
    let result = new Variable(this.ns, new Set([this]), 'abs()');
    result.setForwardCode(`${result.name} = Math.abs(${this.name});`);
    result.setBackwardCode(`${this.gradName} += Math.sign(${this.name}) * ${result.gradName};`);
    return result;
  }

  exp() {
    let result = new Variable(this.ns, new Set([this]), 'exp()');
    result.setForwardCode(`${result.name} = Math.exp(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.name} * ${result.gradName};`);
    return result;
  }

  log() {
    let result = new Variable(this.ns, new Set([this]), 'log()');
    result.setForwardCode(`${result.name} = Math.log(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} / ${this.name};`);
    return result;
  }

  ReLU() {
    let result = new Variable(this.ns, new Set([this]), 'ReLU()');
    result.setForwardCode(`${result.name} = Math.max(0, ${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (${this.name} > 0);`);
    return result;
  }

  ELU() {
    let result = new Variable(this.ns, new Set([this]), 'ELU()');
    result.setForwardCode(`${result.name} = ${this.name} > 0 ? ${this.name} : (Math.exp(${this.name}) - 1);`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (${this.name} > 0 ? 1 : Math.exp(${this.name}));`);
    return result;
  }

  sign() {
    let result = new Variable(this.ns, new Set([this]), 'sign()');
    result.setForwardCode(`${result.name} = Math.sign(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * ${result.name};`);
    return result;
  }

  ParametricReLU(min = 0, scale = 1, shift = 0) {
    let safeMin = Number.parseFloat(min);
    let safeScale = Number.parseFloat(scale);
    let safeShift = Number.parseFloat(shift);

    let result = new Variable(this.ns, new Set([this]), 'ParametricReLU()');
    result.setForwardCode(`${result.name} = Math.max(${safeMin}, ${safeScale} * ${this.name} + ${safeShift});`);
    result.setBackwardCode(
      `${this.gradName} += ${result.gradName} * (${this.name} > ${safeMin} ? ${safeScale} : 0);`
    );
    return result;
  }

  atan() {
    let result = new Variable(this.ns, new Set([this]), 'atan()');
    result.setForwardCode(`${result.name} = Math.atan(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} / (1 + ${this.name} * ${this.name}) ;`);
    return result;
  }

  acos() {
    let result = new Variable(this.ns, new Set([this]), 'acos()');
    result.setForwardCode(`${result.name} = Math.acos(${this.name});`);
    result.setBackwardCode(`${this.gradName} += - ${result.gradName} / (Math.sqrt(1 - ${this.name} * ${this.name})) ;`);
    return result;
  }

  sigmoid() {
    let result = new Variable(this.ns, new Set([this]), 'sigmoid()');
    result.setForwardCode(`${result.name} = 1 / (1 + Math.exp(-${this.name}));`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * ${result.name} * (1 - ${result.name});`);
    return result;
  }

  tanh() {
    let result = new Variable(this.ns, new Set([this]), 'tanh()');
    result.setForwardCode(`${result.name} = Math.tanh(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (1 - ${result.name} * ${result.name});`);
    return result;
  }

  cosh() {
    let result = new Variable(this.ns, new Set([this]), 'chos()');
    result.setForwardCode(`${result.name} = Math.cosh(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * Math.sinh(${this.name});`);
    return result;
  }
}
