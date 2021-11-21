/**
 * Just playing with backward propagation and auto differentiation.
 * It is heavily inspired by https://github.com/karpathy/recurrentjs/blob/master/src/recurrent.js
 * (by Andrej Karpathy (C) MIT license)
 * 
 * For now I'm just learning this model.
 */

export class Matrix {
  constructor(rows, cols, ArrayType = Float32Array) {
    this.type = ArrayType;

    this.rows = rows;
    this.cols = cols;
    this.data = new ArrayType(rows * cols);
    this.gradient = new ArrayType(rows * cols);
  }

  printDataMatrix(roundFactor = 2) {
    for (let i = 0; i < this.rows; ++i) {
      let row = [];
      for (let j = 0; j < this.cols; ++j) {
        row.push(this.data[i * this.cols + j].toFixed(roundFactor));
      }
      console.log(row.join(' '));
    }
  }

  resetGradient() {
    this.gradient.fill(0);
  }
}


export class ComputationTree {
  constructor() {
    this.computationSequence = [];
  }

  backprop() {
    for (let j = this.computationSequence.length - 1; j >= 0; j--) {
      this.computationSequence[j]();
    }
  }

  add(a, b) {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions must agree in add()');
    }
    let out = new Matrix(a.rows, a.cols);

    for (let i = 0; i < a.data.length; i++) {
      out.data[i] = a.data[i] + b.data[i];
    }

    this.computationSequence.push(() => {
      for (let i = 0; i < a.data.length; i++) {
        a.gradient[i] += out.gradient[i];
        b.gradient[i] += out.gradient[i];
      }
    });
    return out;
  }

  mul(a, b) {
    if (a.cols !== b.rows) {
      throw new Error('Matrix dimensions must agree in mul()');
    }
    let out = new Matrix(a.rows, b.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < b.cols; j++) {
        let sum = 0;
        for (let k = 0; k < a.cols; k++) {
          sum += a.data[i * a.cols + k] * b.data[k * b.cols + j];
        }
        out.data[i * b.cols + j] = sum;
      }
    }

    this.computationSequence.push(() => {
      for (let i = 0; i < a.rows; i++) {
        for (let j = 0; j < b.cols; j++) {
          for (let k = 0; k < a.cols; k++) {
            let gradient = out.gradient[i * b.cols + j];

            a.gradient[i * a.cols + k] += b.data[k * b.cols + j] * gradient;
            b.gradient[k * b.cols + j] += a.data[i * a.cols + k] * gradient;
          }
        }
      }
    });
    return out;
  }
}