const emptySet = new Set();

/**
 * Scalar parameter of a model (the one that we are trying to find)
 */
export class Parameter {
  constructor(value, backward, children, name) {
    this.value = value;
    this.grad = 0;
    this.name = name;
    this.children = children || emptySet;
    this.backward = backward || Function.prototype;
    this.parentCount = 0;
  }

  computeGradientsBackward() {
    const traversalOrder = this.getAnotherTraversalOrder();
    for (let i = 0; i < traversalOrder.length; i++) {
      traversalOrder[i].backward(traversalOrder[i]);
    }
  }

  // TODO: Forward compilation/computation without graph recreation?
  getAnotherTraversalOrder() {
    // This is non-recursive version of getTraversalOrder, should work better with huge graphs
    countParents(this);

    let traversalOrder = [];
    let visited = new Set();
    let queue = [this];
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

  getTraversalOrder() {
    let traversalOrder = [];
    let visited = new Set();
    topologicalVisit(this);
    traversalOrder.reverse();

    return traversalOrder;

    function topologicalVisit(from) {
      if (visited.has(from)) return;
      visited.add(from);
      from.children.forEach(child => topologicalVisit(child));
      traversalOrder.push(from);
    }
  }

  // Mathematical operations
  add(other) {
    if (other instanceof Parameter) {
      return new Parameter(
      this.value + other.value, // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad;
        other.grad += out.grad;
      }, new Set([this, other]), '+');
    } else {
      return new Parameter(
      this.value + other, // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad;
      }, new Set([this]), '+ ' + other);
    }
  }

  mul(other) {
    if (other instanceof Parameter)  {
    return new Parameter(
      this.value * other.value, // Value
      (out) => {                   // backprop gradient
        this.grad  += other.value * out.grad;
        other.grad += this.value * out.grad;
      }, new Set([this, other]), '*');
    } else {
      return new Parameter(
        this.value * other, // Value
        (out) => {                   // backprop gradient
          this.grad  += other * out.grad;
        }, new Set([this]), '*' + other);
    }
  }

  sub(other) {
    if (other instanceof Parameter) {
      return new Parameter(
        this.value - other.value, // Value
        (out) => {                   // backprop gradient
          this.grad  += out.grad;
          other.grad -= out.grad;
        }, new Set([this, other]), '-');
    } else {
      return new Parameter(
        this.value - other, // Value
        (out) => {                   // backprop gradient
          this.grad  += out.grad;
        }, new Set([this]), '- ' + other);
    }
  }

  div(other) {
    if (other instanceof Parameter) {
      return new Parameter(
        this.value / other.value, // Value
        (out) => {                   // backprop gradient
          this.grad  += out.grad / other.value;
          other.grad -= this.value * out.grad / (other.value * other.value);
        }, new Set([this, other]), '/');
    } else {
      return new Parameter(
        this.value / other, // Value
        (out) => {                   // backprop gradient
          this.grad  += out.grad / other;
        }, new Set([this]), '/ ' + other);
    }
  }

  pow(degree) {
    if (!Number.isFinite(degree)) throw new Error('degree must be a number');

    return new Parameter(
      Math.pow(this.value, degree), // Value
      (out) => {                            // backprop gradient
        this.grad  += degree * Math.pow(this.value, degree - 1) * out.grad;
      }, new Set([this]), '^' + degree);
  }

  sin() {
    return new Parameter(
      Math.sin(this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  += Math.cos(this.value) * out.grad;
      }, new Set([this]), 'sin');
  }

  cos() {
    return new Parameter(
      Math.cos(this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  -= Math.sin(this.value) * out.grad;
      }, new Set([this]), 'cos');
  }

  exp() {
    return new Parameter(
      Math.exp(this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  += Math.exp(this.value) * out.grad;
      }, new Set([this]), 'exp');
  }

  log() {
    return new Parameter(
      Math.log(this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad / this.value;
      }, new Set([this]), 'log');
  }

  abs() {
    return new Parameter(
      Math.abs(this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad * Math.sign(this.value);
      }, new Set([this]), 'abs');
  }

  relu() {
    return new Parameter(
      Math.max(0, this.value), // Value
      (out) => {                   // backprop gradient
        this.grad += out.grad * (this.value > 0);
      }, new Set([this]), 'ReLU');
  }

  sigmoid() {
    let self = this;
    return new Parameter(
      1 / (1 + Math.exp(-this.value)), // Value
      function(out) {                   // backprop gradient
        // Note that `this` is actual value of the parameter, not parent's value
        self.grad  += out.grad * (1 - this.value) * this.value;
      }, new Set([this]), 'sigmoid');
  }

  elu() {
    return new Parameter(
      this.value > 0 ? this.value : Math.exp(this.value) - 1, // Value
      (out) => {                   // backprop gradient
        this.grad += out.grad * (this.value > 0 ? 1 : Math.exp(this.value));
      }, new Set([this]), 'ELU');
  }

  tanh() {
    let self = this;
    return new Parameter(
      Math.tanh(this.value), // Value
      function(out) {                   // backprop gradient
        // Note that `this` is actual value of the parameter, not parent's value
        self.grad  += out.grad * (1 - this.value * this.value);
      }, new Set([this]), 'tanh');
  }

  getDot() {
    let nodes = this.getTraversalOrder();
    let dot = ['digraph G {']
    nodes.forEach((node, i) => {
      node.id = i;
      dot.push(`${node.id} [label="${node.name}\\n${node.value} | ${node.grad}"]`);
    });
    let edges = new Set()
    nodes.forEach(node => {
      node.children.forEach(child => {
        let edgeId = node.id + '_' + child.id;
        if (edges.has(edgeId)) return;
        edges.add(edgeId);
        dot.push(`${node.id} -> ${child.id}`);
      });
    });
    dot.push('}');
    return dot.join('\n');
  }
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