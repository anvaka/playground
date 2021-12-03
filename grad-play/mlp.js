import {Parameter} from './autograd.js';

class Node {
  constructor(inCount, name) {
    this.w = [];
    for (let i = 0; i < inCount; i++) {
      this.w.push(new Parameter(Math.random() * 2 - 1, null, null, 'w_' + name + '_' + i));
    }
    this.bias = new Parameter(Math.random() * 2 - 1, null, null, 'b_' + name);
  }

  getOutput(input) {
    let sum = this.bias;
    if (input.length !== this.w.length) {
      throw new Error('Input length does not match weight length');
    }

    this.w.forEach((param, i) => {
      sum = sum.add(param.mul(input[i]));
    });

    return sum;
  }

  forEachParameter(callback) {
    this.w.forEach(callback);
    callback(this.bias);
  }
}

class Layer {
  constructor(inCount, outCount, layerName) {
    this.nodes = [];
    this.name = layerName;
    for (let i = 0; i < outCount; i++) {
      this.nodes.push(new Node(inCount, layerName + '_' + i));
    }
    this.activation = x => x.ReLU();
  }

  setActivation(activation) {
    this.activation = activation;
  }

  getOutput(input) {
    return this.nodes.map(node => this.activation(node.getOutput(input)));
  }

  forEachParameter(callback) {
    this.nodes.forEach(node => node.forEachParameter(callback));
  }
}

export class MLP {
  constructor(layerSizes) {
    this.layers = [];
    for (let i = 1; i < layerSizes.length; i++) {
      this.layers.push(new Layer(layerSizes[i - 1], layerSizes[i], i));
    }
    this.layers[this.layers.length - 1].setActivation(x => x);
  }

  zeroGrad() { 
    this.forEachParameter(param => param.grad = 0);
  }

  getOutput(input) {
    return this.layers.reduce((input, layer) => layer.getOutput(input), input);
  }

  forEachParameter(callback) {
    this.layers.forEach(layer => layer.forEachParameter(callback));
  }
}