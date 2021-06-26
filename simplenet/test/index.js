import tap from 'tap';
import createNetwork from '../index.js';
import { LINEAR, SIGMOID } from '../lib/Activations.js';

const test = tap.test;

test('it can learn', (t) => {
  let n = createNetwork([
      {
        size: 1, // First layer doesn't have activation
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

    (output, input) => output.map((x, idx) => 2 * (x - input[idx]**2)),

    0.1
  );

  for (let i = 0; i < 1000; ++i) {
    n.learnWeights([4])
  }
  console.log(n.predict([2]));

  t.end();
})