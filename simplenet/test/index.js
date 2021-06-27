import tap from 'tap';
import createNetwork from '../index.js';
import { LINEAR, SIGMOID } from '../lib/Activations.js';
import Random from '../lib/random.js';

const test = tap.test;

test('it can learn squares of x from [0 to 10]', (t) => {
  let n = createNetwork([
      {
        size: 1, // First layer is an input layer and doesn't have activation
      }, 
      {
        size: 4,
        activation: SIGMOID
      }, 
      {
        size: 1,
        activation: LINEAR
      }
    ], 

    (output, input, ctx) => output.map((x, idx) => 2 * (x - ctx[idx])),

    /* learning rate = */ 0.01
  );

  let trainingSet = [];
  for (let i = 0; i < 10; ++i) {
    // Normalized input (`i/10`) makes learning easier here
    trainingSet.push({input: [i/10], output: [i * i]})
  }

  for (let i = 0; i < 4000; ++i) {
    let sample = trainingSet[i % 10];
    n.learnWeights(sample.input, sample.output)
  }
  for (let i = 0; i < 10; ++i) {
    console.log(`Predicted ${i} * ${i} is ${Math.round(n.predict([i/10]))}`);
  }

  t.end();
});

test('it can perform binary classification', (t) => {
  let n = createNetwork([
      {
        // X,Y coordinates
        size: 2,
      }, 
      {
        size: 4,
        activation: SIGMOID
      }, 
      {
        size: 2, // two classes as an output
        activation: SIGMOID
      }
    ], 

    (output, input, ctx) => {
      // during our training we passed the expected class into `learnWeights(x, ctx)`
      return output.map((x, idx) => (x - ctx[idx]));
    },

    /* learning rate = */ 0.01
  );

  let rnd = new Random(42);
  // let's create two functions:
  let trainingSet = [];
  let classes = [[1, 0], [0, 1]];
  for (let i = 0; i < 100; ++i) {
    // In the first class points are inside circle with radius 4
    let r = rnd.next() * 4;
    let a = rnd.next() * 2 * Math.PI;
    trainingSet.push({
      x: r * Math.cos(a),
      y: r * Math.sin(a),
      expectedOutput: classes[0]
    });

    // In the second class points are on the strip of radius [5, 6];
    let min = 5;
    let max = 6;
    r = min + rnd.next() * (max - min);
    a = rnd.next() * 2 * Math.PI;
    let x = r * Math.cos(a);
    let y = r * Math.sin(a);
    trainingSet.push({
      x, y,
      expectedOutput: classes[1]
    });
  }

  for (let i = 0; i < 1000; ++i) {
    rnd.forEach(trainingSet, sample => {
      n.learnWeights([sample.x, sample.y], sample.expectedOutput)
    });
  }
  let x = 0, y = 0;
  console.log(`Predicted (${x}, ${y}): ${n.predict([x, y])}`);

  x = 5;
  y = 5;
  console.log(`Predicted (${x}, ${y}): ${n.predict([x, y])}`);

  t.end();
});