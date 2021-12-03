const emptySet = new Set();

export class NS {
  constructor() {
    this.lastUsed = 0;
    this.lastUsedFunction = 0;
    this.dtype = 'Float64Array'
    this.functionCallbacks = [];
    this.setGradientCallbacks = [];
  }

  allocateSpace() {
    let name = this.lastUsed;
    this.lastUsed++;
    return name;
  }

  allocateFunctionSpace(functionCallback, setGradientCallback) {
    this.functionCallbacks.push(functionCallback);
    this.setGradientCallbacks.push(setGradientCallback);
    return this.functionCallbacks.length - 1;
  }

  getVariableDefinitionCode() {
    return `
  var v = new ${this.dtype}(${this.lastUsed});
  var gv = new ${this.dtype}(${this.lastUsed});
`;
  }

  getAllNamesReturnCode() {
    return `v: v, gv: gv`
  }

  getVariableNameForId(id) {
    return `v[${id}]`;
  }

  getGradientNameForId(id) {
    return `gv[${id}]`;
  }
}

export class Variable {
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
    if (!this.compiled) throw new Error('Variable not compiled');
    this.compiled.forward();
  }

  backwardPass() {
    if (!this.compiled) throw new Error('Variable not compiled');
    this.compiled.backward();
  }

  compile() {
    if (this.compiled) {
      return;
    }
    let traversalOrder = getTraversalOrder(this);
    let forwardCode = [];
    let backwardCode = [];
    for (let i = traversalOrder.length - 1; i >= 0; i--) {
      let node = traversalOrder[i];
      if (node.forwardCode) forwardCode.push(node.forwardCode);

      let backNode = traversalOrder[traversalOrder.length - 1 - i];
      if (backNode.backwardCode) backwardCode.push(backNode.backwardCode);
    }
    this.forwardCode = forwardCode.join('\n');

    let code = `
${this.ns.getVariableDefinitionCode()}

function forward() {
  ${forwardCode.join('\n  ')}
}

function backward() {
  ${backwardCode.join('\n  ')}
}

return {
  forward: forward,
  backward: backward,
  ${this.ns.getAllNamesReturnCode()}
}
`
    let result = new Function('f', 'gf', code)(this.ns.functionCallbacks, this.ns.setGradientCallbacks);
    for (let i = traversalOrder.length - 1; i >= 0; i--) {
      traversalOrder[i].compiled = result;
    }
  }

  setBackwardCode(code) {
    this.backwardCode = code;
  }

  setForwardCode(code) {
    this.forwardCode = code;
  }
}

export class FunctionVariable extends Variable {
  constructor(ns, children) {
    super(ns, children);

    this.funcId = ns.allocateFunctionSpace(() => this.cbGetValue(), (g) => this.cbSetGradient(g));
    this.forwardCode = `${this.name} = f[${this.funcId}]();`;
    this.backwardCode = `gf[${this.funcId}](${this.gradName}); ${this.gradName} = 0;`;
    this.returnValue = null;
    this.cbGetValue = null;
    this.cbSetGradient = null;
  }

  setCallback(getValue, setGradient) {
    this.cbGetValue = getValue;
    this.cbSetGradient = setGradient;
  }
}

export class ScalarVariable extends Variable {
  constructor(ns, children, name) {
    super(ns, children);
    this.uiName = name;
  }

  get value() {
    return this.compiled.v[this.id];
  }

  set value(x) {
    this.compiled.v[this.id] = x;
  }

  setValue(value) {
    if (!this.compiled) throw new Error('Variable not compiled');
    this.compiled.v[this.id] = value;
  }

  getValue() {
    if (!this.compiled) throw new Error('Variable not compiled');
    return this.compiled.v[this.id];
  }

  setGradient(value) {
    if (!this.compiled) throw new Error('Variable not compiled');
    return this.compiled.gv[this.id] = value;
  }

  getGradient() {
    if (!this.compiled) throw new Error('Variable not compiled');
    return this.compiled.gv[this.id];
  }
  
  // These are mathematical functions, add yours.
  add(other) {
    if (other instanceof Variable) {
      let result = new ScalarVariable(this.ns, new Set([this, other]));
      result.setForwardCode(`${result.name} = ${this.name} + ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${result.gradName}; ${other.gradName} += ${result.gradName}`
      )
      return result;
    }
    if (Number.isNaN(other)) {
      throw new Error('Cannot add NaN');
    }

    let result = new ScalarVariable(this.ns, new Set([this]));
    let safeValue = Number.parseFloat(other);

    result.setForwardCode(`${result.name} = ${this.name} + ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName};`)
    return result;
  }

  sub(other) {
    if (other instanceof Variable) {
      let result = new ScalarVariable(this.ns, new Set([this, other]));
      result.setForwardCode(`${result.name} = ${this.name} - ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${result.gradName}; ${other.gradName} -= ${result.gradName}`
      )
      return result;
    }
    if (Number.isNaN(other)) {
      throw new Error('Cannot sub NaN');
    }

    let result = new ScalarVariable(this.ns, new Set([this]));
    let safeValue = Number.parseFloat(other);

    result.setForwardCode(`${result.name} = ${this.name} - ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName};`)
    return result;
  }

  mul(other) {
    if (other instanceof Variable) {
      let result = new ScalarVariable(this.ns, new Set([this, other]));
      result.setForwardCode(`${result.name} = ${this.name} * ${other.name};`);
      result.setBackwardCode(
        `${this.gradName} += ${other.name} * ${result.gradName}; ${other.gradName} += ${this.name} * ${result.gradName}`
      )
      return result;
    } 
    if (Number.isNaN(other)) {
      throw new Error('Cannot multiply by NaN');
    }

    let result = new ScalarVariable(this.ns, new Set([this]));
    let safeValue = Number.parseFloat(other);

    result.setForwardCode(`${result.name} = ${this.name} * ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${safeValue} * ${result.gradName};`)
    return result;
  }

  div(other) {
    if (other instanceof Variable) {
      let result = new ScalarVariable(this.ns, new Set([this, other]));
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
    let result = new ScalarVariable(this.ns, new Set([this]));
    let safeValue = Number.parseFloat(other);
    result.setForwardCode(`${result.name} = ${this.name} / ${safeValue};`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} / ${safeValue};`);
    return result;
  }

  pow(degree) {
    if (degree instanceof Variable) {
      let result = new ScalarVariable(this.ns, new Set([this, degree]));
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

    let result = new ScalarVariable(this.ns, new Set([this]));
    let safeValue = Number.parseFloat(degree);
    result.setForwardCode(`${result.name} = Math.pow(${this.name}, ${safeValue});`);
    result.setBackwardCode(`${this.gradName} += ${safeValue} * Math.pow(${this.name}, ${safeValue} - 1) * ${result.gradName};`);
    return result;
  }

  sin() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.sin(${this.name});`);
    result.setBackwardCode(`${this.gradName} += Math.cos(${this.name}) * ${result.gradName};`);
    return result;
  }

  cos() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.cos(${this.name});`);
    result.setBackwardCode(`${this.gradName} -= Math.sin(${this.name}) * ${result.gradName};`);
    return result;
  }

  abs() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.abs(${this.name});`);
    result.setBackwardCode(`${this.gradName} += Math.sign(${this.name}) * ${result.gradName};`);
    return result;
  }

  exp() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.exp(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.name} * ${result.gradName};`);
    return result;
  }

  log() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.log(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} / ${this.name};`);
    return result;
  }

  ReLU() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.max(0, ${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (${this.name} > 0);`);
    return result;
  }

  ELU() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = ${this.name} > 0 ? ${this.name} : (Math.exp(${this.name}) - 1);`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (${this.name} > 0 ? 1 : Math.exp(${this.name}));`);
    return result;
  }

  sigmoid() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = 1 / (1 + Math.exp(-${this.name}));`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * ${result.name} * (1 - ${result.name});`);
    return result;
  }

  tanh() {
    let result = new ScalarVariable(this.ns, new Set([this]));
    result.setForwardCode(`${result.name} = Math.tanh(${this.name});`);
    result.setBackwardCode(`${this.gradName} += ${result.gradName} * (1 - ${result.name} * ${result.name});`);
    return result;
  }
}

function getTraversalOrder(start) {
  countParents(start);

  let traversalOrder = [];
  let visited = new Set();
  let queue = [start];
  while (queue.length > 0) {
    let node = queue.shift();
    if (visited.has(node)) continue;
    if (node.parentCount !== 0) {
      throw new Error('Should have no parents at this point');
    }

    traversalOrder.push(node);
    visited.add(node);

    node.children.forEach(child => {
      child.parentCount -= 1
      if (child.parentCount === 0) {
        queue.push(child);
      }
    })
  }
  return traversalOrder;
}

function setParentCountToZero(from) {
  let queue = [from];
  let visited = new Set();
  while (queue.length > 0) {
    let node = queue.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    node.parentCount = 0;
    node.children.forEach(child => queue.push(child));
  }
}

function countParents(from) {
  setParentCountToZero(from)

  let queue = [from];
  let visited = new Set();
  while (queue.length > 0) {
    let node = queue.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    node.children.forEach(child => {
      child.parentCount += 1;
      queue.push(child);
    });
  }
}