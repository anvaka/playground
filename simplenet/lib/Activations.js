export const SIGMOID = {f: sigmoid, df: dSigmoid}
export const LINEAR = {f: (x) => x, df: () => 1};
export const RELU = {f: (x) => Math.max(0, x), df: (x) => 0}
export const SIN = {f: (x) => Math.sin(x), df: (x) => Math.cos(x)}
export const GAUSSIAN = {f: x => Math.exp(-x * x), df: x => - 2 * x * Math.exp(-x * x)}
export const TANH = {f: (x) => Math.tanh(x), df: (x) => {
  let d = Math.tanh(x);
  return 1 - d * d
}}

export const SILU = {
  f: (x) => {
    return x * sigmoid(x);
  },
  df: (x) => {
    let e = Math.exp(-x);
    let e1 = (1 + e) ;
    return (e1 + x * e)/(e1 * e1)
  }
}

function sigmoid(x) {
  return 1/(1 + Math.exp(-x))
}

function dSigmoid(x) {
  let s = sigmoid(x);
  return s * (1 - s);
}