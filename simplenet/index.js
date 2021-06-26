import ngraphRandom from 'ngraph.random';
import Matrix from './lib/Matrix.js';

export default function createNetwork(layers, derivativeCost, eta = 0.01) {
  let layersCount = layers.length;
  let random = ngraphRandom(42);
  let biases = initBiases();   // each layer gets array of biases (one bias per node)
  let weights = initWeights(); // each layer get a matrix of weights
  let activationFunction = initActivationFunction();

  if (!derivativeCost) {
    derivativeCost = defaultDerivativeCost;
  }
  
  return {
    biases: biases,
    weights: weights,
    predict: predict,
    learnWeights: learnWeights,
  };
  
  function learnWeights(input, newEta) {
    if (newEta !== undefined) {
      eta = newEta;
    }
    let a = input;
    if (input.length != layers[0].size) {
      throw new Error("Input size does not match the first layer size");
    }

    // feed forward:
    let zs = []; // store activation function inputs
    let activations = [a]; // Store activations layer by layer

    if (weights.length !== biases.length) throw new Error('Biases/weights mismatch');
    
    for (let l = 0; l < weights.length; ++l) {
      let w = weights[l];
      let b = biases[l];
      let zn = addVectors(w.timesVec(a), b);
      zs.push(zn);
      a = zn.map(x => activationFunction[l].f(x))
      activations.push(a);
    }

    // back propagation:
    let df = activationFunction[activationFunction.length - 1].df
    // δx,L = ∇aCx ⊙ σ′(zx,L).
    let delta = vecMul(derivativeCost(a, input), funcApply(df, zs[zs.length - 1]));

    let nablaB = new Array(biases.length); 
    let nablaW = new Array(weights.length);

    // The gradient of the cost function is given by
    nablaB[nablaB.length - 1] = delta;
    nablaW[nablaW.length - 1] = Matrix.createForm_A_dot_B_transposed(delta, activations[activations.length - 2]);
    
    for (let l = 2; l < layers.length; ++l) {
      let z = zs[zs.length - l];
      let w = weights[weights.length - l + 1];
      let df = activationFunction[activationFunction.length - l].df
      let sp = z.map(x => df(x))
      delta = w.transposeTimesVec(delta);
      delta = delta.map((x, idx) => x * sp[idx]);
      
      nablaB[nablaB.length - l] = delta;
      nablaW[nablaW.length - l] = Matrix.createForm_A_dot_B_transposed(delta, activations[activations.length - l - 1]);
    }
    
    updateWeights(nablaW, eta);
    updateBiases(nablaB, eta);
  }
  
  function updateWeights(nablaW, eta) {
    if (nablaW.length !== weights.length) throw new Error('Weight updates are wrong');
    for (let i = 0; i < nablaW.length; ++i) {
      weights[i].sub(nablaW[i], eta);
    }
  }
  
  function updateBiases(nablaB, eta) {
 
    if (nablaB.length !== biases.length) throw new Error('Biases dimensions mismatch');
    for (let i = 0; i < nablaB.length; ++i) {
      let our = biases[i];
      let their = nablaB[i];
      if (our.length !== their.length) throw new Error('Wrong bias dimension');
      
      for (let j = 0; j < our.length; ++j) {
        our[j] -= eta * their[j];
      }
    }
  }
    
  function defaultDerivativeCost(output, input) {
    if (input.length !== output.length) throw new Error('meh, something is wrong for this err function');
    return output.map((yPred, idx) => {
      // let's pretend we learn x:
      let y = input[idx] * input[idx];
      return (yPred - y)
    })
  }
  
  function vecMul(a, b) {
    if (a.length !== b.length) throw new Error('cardinality mismatch');
    return a.map((x, i) => x * b[i]);
  }
  
  function funcApply(func, vec) {
    return vec.map(x => func(x));
  }
  
  function predict(input) {
    let a = input;
    if (input.length != layers[0].size) {
      throw new Error("Input size does not match the first layer size");
    }
    
    for (let l = 0; l < weights.length; ++l) {
      let w = weights[l];
      let b = biases[l];
      let zn = addVectors(w.timesVec(a), b);
      a = zn.map(x => activationFunction[l].f(x))
    }
    
    return a;
  }
  
  function initActivationFunction() {
    let activations = [];
    for (let i = 1; i < layersCount; ++i) {
      activations.push(layers[i].activation);
    }
    return activations;
  }
  
  function initBiases() {
    let biases = [];
    for (let i = 1; i < layersCount; ++i) {
      let nodeCount = layers[i].size;
      let bias = [];
      for (let j = 0; j < nodeCount; ++j) {
        bias.push(random.gaussian());
      }
      biases.push(bias);
    }
    return biases;
  }
  
  function initWeights() {
    let weights = [];
    for (let i = 0; i < layersCount - 1; ++i) {
      weights.push(new Matrix(layers[i + 1].size, layers[i].size, () => random.gaussian()))
    }
    return weights;
  }
}

function addVectors(a, b) {
  if (a.length !== b.length) throw new Error('Vector dimensions mismatch in addVectors()');
  a.forEach((x, idx) => a[idx] += b[idx]);
  return a;
}