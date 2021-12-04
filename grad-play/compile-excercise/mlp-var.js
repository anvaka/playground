import {NS, ScalarVariable} from './Variable.js';

class Node {
  constructor(ns, inCount, name) {
    this.w = [];
    for (let i = 0; i < inCount; i++) {
      this.w.push(new ScalarVariable(ns, null, 'w_' + name + '_' + i));
      //, Math.random() * 2 - 1, null, null, 'w_' + name + '_' + i));
    }
    this.bias = new ScalarVariable(ns, null, 'b_' + name);
    //Math.random() * 2 - 1, null, null, 'b_' + name);
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
  constructor(ns, inCount, outCount, layerName) {
    this.nodes = [];
    this.name = layerName;
    for (let i = 0; i < outCount; i++) {
      this.nodes.push(new Node(ns, inCount, layerName + '_' + i));
    }
    this.activation = x => x.ELU();
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
    let ns = new NS();
    this.ns = ns;
    this.inputs = [];
    for (let i = 0; i < layerSizes[0]; i++) {
      this.inputs.push(new ScalarVariable(ns));
    }

    this.layers = [];
    for (let i = 1; i < layerSizes.length; i++) {
      this.layers.push(new Layer(ns, layerSizes[i - 1], layerSizes[i], i));
    }
    // last layer is linear activation
    this.layers[this.layers.length - 1].setActivation(x => x);
    this.gv = null;
  }

  zeroGrad() { 
    this.loss.compiled.gv.fill(0);
  }

  setLoss(cb) {
    this.lossCallback = cb;
  }

  compile() {
    this.output = this.layers.reduce((input, layer) => layer.getOutput(input), this.inputs);
    this.loss = this.lossCallback(this.output);
    this.loss.compile();
  }

  forward(input) {
    if (!this.loss) {
      this.compile();
    }

    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].value = input[i];
    }
    this.loss.forwardPass();
    return this.output;
  }

  forEachParameter(callback) {
    this.layers.forEach(layer => layer.forEachParameter(callback));
  }
}