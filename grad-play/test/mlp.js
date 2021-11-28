import {test} from 'tap';
import {MLP} from '../mlp.js';

test('it can feed forward', (t) => {
  let net = new MLP([1, 3, 1]);
  let f = (x) => x * 2 + 4;

  let learningRate = 0.1;
  net.forEachParameter(p => {
    p.value = 0.01;
    // console.log(p.value);
  })

  for (let i = 0; i < 100; i++) {
    let totalLoss = 0;
    let sampleCount = 0;

    for (let x = 0; x < 3; x += 1) {
      net.zeroGrad();
      let out = net.getOutput([x]);
      let delta = (out[0].value - f(x));
      let lossGradient = 2 * delta; 
      out[0].grad = lossGradient;
      out[0].computeGradientsBackward();

      net.forEachParameter(p => p.value -= learningRate * p.grad);
      sampleCount += 1;
      totalLoss += delta * delta;
    }
    console.log('loss: ', totalLoss / sampleCount);
  }

  console.log('Predicting f(10): ', net.getOutput([10])[0].value);
  t.end();
});
