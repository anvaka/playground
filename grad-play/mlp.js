import {Parameter} from './autograd.js';

class Node {
  constructor(inCount) {
    this.w = [];
    for (let i = 0; i < inCount; i++) {
      this.w.push(new Parameter(Math.random() * 2 - 1));
    }
    this.bias = new Parameter(Math.random() * 2 - 1);
  }

  getOutput(input) {
    let sum = this.bias;
    if (input.length !== this.w.length) {
      throw new Error('Input length does not match weight length');
    }

    this.w.forEach((param, i) => {
      sum = sum.add(param.mul(input[i]));
    });

    return sum.relu();
  }

  zeroGrad() {
    this.w.forEach(param => param.grad = 0);
    this.bias.grad = 0;
  }

  forEachParameter(callback) {
    this.w.forEach(callback);
    callback(this.bias);
  }
}

class Layer {
  constructor(inCount, outCount) {
    this.nodes = [];
    for (let i = 0; i < outCount; i++) {
      this.nodes.push(new Node(inCount));
    }
  }

  getOutput(input) {
    return this.nodes.map(node => node.getOutput(input));
  }

  zeroGrad() {
    this.nodes.forEach(node => node.zeroGrad());
  }

  forEachParameter(callback) {
    this.nodes.forEach(node => node.forEachParameter(callback));
  }
}

export class MLP {
  constructor(layerSizes) {
    this.layers = [];
    for (let i = 1; i < layerSizes.length; i++) {
      this.layers.push(new Layer(layerSizes[i - 1], layerSizes[i]));
    }
  }

  zeroGrad() { 
    this.forEachParameter(param => param.grad = 0);
    // this.layers.forEach(layer => layer.zeroGrad()); 
  }

  getOutput(input) {
    return this.layers.reduce((input, layer) => layer.getOutput(input), input);
  }

  forEachParameter(callback) {
    this.layers.forEach(layer => layer.forEachParameter(callback));
  }
}