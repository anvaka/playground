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
  }

  computeGradientsBackward() {
    const traversalOrder = this.getTraversalOrder();
    for (let i = 0; i < traversalOrder.length; i++) {
      traversalOrder[i].backward(traversalOrder[i]);
    }
  }

  // TODO: Forward compilation/computation without graph recreation

  reset() {
    const traversalOrder = this.getTraversalOrder();
    for (let i = 0; i < traversalOrder.length; i++) {
      traversalOrder[i].grad = 0;
    }
  }

  getTraversalOrder() {
    let traversalOrder = [];
    let visited = new Set();
    let queue = [this];
    while (queue.length) {
      let node = queue.pop();
      if (visited.has(node)) continue;
      traversalOrder.push(node);
      visited.add(node);
      node.children.forEach(child => queue.push(child));
    }

    return traversalOrder;
  }

  // Mathematical operations
  add(other) {
    if (!(other instanceof Parameter)) other = new Parameter(other);
    return new Parameter(
      this.value + other.value, // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad;
        other.grad += out.grad;
      }, new Set([this, other]), '+');
  }

  mul(other) {
    if ((other instanceof Parameter))  {
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
        }, new Set([this]), '*');
    }
  }

  sub(other) {
    if ((other instanceof Parameter)) {
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
        }, new Set([this]), '-');
    }
  }

  div(other) {
    if ((other instanceof Parameter)) {
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
        }, new Set([this]), '/');
    }
  }

  pow(degree) {
    if (!Number.isFinite(degree)) throw new Error('degree must be a number');

    return new Parameter(
      Math.pow(this.value, degree), // Value
      (out) => {                            // backprop gradient
        this.grad  += degree * Math.pow(this.value, degree - 1) * out.grad;
      }, emptySet, '^');
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

  relu() {
    return new Parameter(
      Math.max(0, this.value), // Value
      (out) => {                   // backprop gradient
        this.grad  += out.grad * (this.value > 0);
      }, new Set([this]), 'relu');
  }
}