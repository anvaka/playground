import tap from 'tap';
import createNetwork from '../index.js';
import { LINEAR, SIGMOID } from '../lib/Activations.js';

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

    (output, input) => output.map((x, idx) => 2 * (x - (10 * input[idx])**2)),

    /* learning rate = */ 0.01
  );

  for (let i = 0; i < 4000; ++i) {
    // We use `i/10` to avoid gradient explosion
    n.learnWeights([(i%10)/10])
  }
  for (let i = 0; i < 10; ++i) {
    console.log(`Predicted ${i} * ${i} is ${Math.round(n.predict([i/10]))}`);
  }

  t.end();
})