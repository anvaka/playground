import Matrix from './lib/Matrix.js';
import Random from './lib/random.js';

/**
 * A single layer in the neural network
 * 
 * @typedef {Object} Layer
 * @property {number} size - number of neurons in the layer
 * @property {ActivationFunction} activation activation function object
 */

/**
 * @typedef {Object} ActivationFunction
 * @property {function(number):number} f activation function that is used during forward pass
 * @property {function(number):number} df derivative of the activation function
 */

/**
 * @callback DerivativeCostFunction
 * @param {number[]} output - network's last layer output
 * @param {number[]} input - network's input to `learnWeights(input, context)`
 * @param {Object} context - optional argument that was passed to `learnWeights(input, context)`
 * 
 * @returns {number[]} loss function's gradient.
 */

/**
 * Creates a new neural network. See the ./test/index.js for examples.
 * 
 * @param {Layer[]} layers that create the network.
 * @param {DerivativeCostFunction} derivativeCost 
 * @param {number} eta learning rate.
 */
export default function createNetwork(layers, derivativeCost, eta = 0.01) {
  if (!derivativeCost) {
    throw new Error('Please provide a function that returns derivative of the loss function')
  }
  
  const layersCount = layers.length;
  const random = new Random(42);
  const biases = initBiases();   // each layer gets array of biases (one bias per node)
  const weights = initWeights(); // each layer get a matrix of weights
  const activationFunction = initActivationFunction();

  return {
    biases: biases,
    weights: weights,
    getLayers: () => layers,
    predict,
    setLearningRate,
    getLearningRate,
    learnWeights,
  };

  function setLearningRate(newEta) {
    if (newEta === undefined) {
      throw new Error('Learning rate cannot be undefined');
    }
    eta = newEta;
  }
  
  function getLearningRate() { return eta; }
  
  function learnWeights(input, inputContext) {
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
      let zn = addVectorsInPlace(w.timesVec(a), b);
      zs.push(zn);
      a = zn.map(x => activationFunction[l].f(x))
      activations.push(a);
    }

    // last `a` is our network's output:
    let outputCost = derivativeCost(a, input, inputContext)

    // back propagation:
    let df = activationFunction[activationFunction.length - 1].df
    // δx,L = ∇aCx ⊙ σ′(zx,L).
    let delta = multiplyVectorsInPlace(outputCost, applyFunctionToVector(df, zs[zs.length - 1]));

    // Store errors layer by layer
    let biasError = new Array(biases.length); 
    let weightError = new Array(weights.length); 

    biasError[biasError.length - 1] = delta;
    weightError[weightError.length - 1] = Matrix.createForm_A_dot_B_transposed(delta, activations[activations.length - 2]);
    
    for (let l = 2; l < layers.length; ++l) {
      let z = zs[zs.length - l];
      let w = weights[weights.length - l + 1];
      delta = w.transposeTimesVec(delta);
      let df = activationFunction[activationFunction.length - l].df;
      // let sp = z.map(x => df(x))
      // delta = delta.map((x, idx) => x * sp[idx]);
      delta.forEach((x, idx) => delta[idx] = x * df(z[idx]));
      
      biasError[biasError.length - l] = delta;
      weightError[weightError.length - l] = Matrix.createForm_A_dot_B_transposed(delta, activations[activations.length - l - 1]);
    }
    
    updateWeights(weightError, eta);
    updateBiases(biasError, eta);
  }
  
  function updateWeights(weightError, eta) {
    if (weightError.length !== weights.length) throw new Error('Weight updates are wrong');

    for (let i = 0; i < weightError.length; ++i) {
      weights[i].subScaled(weightError[i], eta);
    }
  }
  
  function updateBiases(biasError, eta) {
    if (biasError.length !== biases.length) throw new Error('Biases dimensions mismatch');
    for (let i = 0; i < biasError.length; ++i) {
      let our = biases[i];
      let their = biasError[i];
      if (our.length !== their.length) throw new Error('Wrong bias dimension');
      
      for (let j = 0; j < our.length; ++j) {
        our[j] -= eta * their[j];
      }
    }
  }

  function predict(input) {
    let a = input;
    if (input.length != layers[0].size) {
      throw new Error("Input size does not match the first layer size");
    }
    
    for (let l = 0; l < weights.length; ++l) {
      let w = weights[l];
      let b = biases[l];
      let zn = addVectorsInPlace(w.timesVec(a), b);
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

function addVectorsInPlace(a, b) {
  if (a.length !== b.length) throw new Error('Vector dimensions mismatch in addVectorsInPlace()');
  a.forEach((x, idx) => a[idx] += b[idx]);
  return a;
}

function multiplyVectorsInPlace(a, b) {
  if (a.length !== b.length) throw new Error('Vector dimensions mismatch in multiplyVectorsInPlace()');
  a.forEach((x, idx) => a[idx] *= b[idx]);
  return a;
}

function applyFunctionToVector(func, vec) {
  return vec.map(x => func(x));
}
