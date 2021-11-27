import {test} from 'tap';
import {Parameter} from '../autograd.js';

test('it can multiply stuff', (t) => {
  let a = new Parameter(3);
  let b = new Parameter(2);
  let out = a.mul(b);
  t.equal(out.value, 3 * 2)

  out.grad = 5;
  out.computeGradientsBackward();

  t.equal(a.grad, 5 * 2, 'a.grad');
  t.equal(b.grad, 5 * 3, 'b.grad');

  t.end();
});

test('it can add stuff', (t) => {
  let a = new Parameter(3);
  let b = new Parameter(2);
  let out = a.add(b);
  t.equal(out.value, 3 + 2)

  out.grad = 5;
  out.computeGradientsBackward();

  t.equal(a.grad, 5, 'a.grad');
  t.equal(b.grad, 5, 'b.grad');

  t.end();
});

test('it can calculate cosine gradients', t => {
  let a = new Parameter(0.3);
  let b = new Parameter(3);
  let c = new Parameter(4);
  let out = b.mul(a.add(c).cos());
  t.equal(out.value, Math.cos(0.3 + 4) * 3);

  out.grad = 5;
  out.computeGradientsBackward();

  t.equal(a.grad, -5 * 3 * Math.sin(0.3 + 4), 'a.grad');
  t.equal(b.grad, 5 * Math.cos(0.3 + 4), 'b.grad');
  t.equal(c.grad, -5 * 3 * Math.sin(0.3 + 4), 'c.grad');

  t.end();
})

test('it can multiply scalars', t => {
  let a = new Parameter(3);
  let out = a.mul(2);
  t.equal(out.value, 3 * 2)

  out.grad = 5;
  out.computeGradientsBackward();

  t.equal(a.grad, 5 * 2, 'a.grad');

  t.end();
})

test('it can do add and multiply', (t) => {
  let x = new Parameter(4);
  let a = new Parameter(3);
  let b = new Parameter(2);
  // ax + b (x = 4)
  let out = x.mul(a).add(b);
  t.equal(out.value, 4 * 3 + 2)

  out.grad = 5; // assume this is our total gradient.

  // Now what would be contributions of individual parameters?
  out.computeGradientsBackward();

  t.equal(a.grad, 4 * 5, 'a.grad');
  t.equal(b.grad, 5, 'b.grad');
  t.equal(x.grad, 3 * 5, 'x.grad');

  t.end();
});

test('can it fit', (t) => {
  // let's guess a line:
  // y = a * x + b, where a = 2, b = 3
  // and ask our tiny model to fit it
  let trueA = 2; let trueB = 3;
  let f = (x) => trueA * x + trueB;

  let learningRate = 0.1;
  let a = new Parameter(Math.random());
  let b = new Parameter(Math.random());
  for (let i = 0 ; i < 400; ++i) {
    for (let x = 2; x < 4; ++x) {
      // TODO: Should not recreate graph every time. Use `forward(x)`?
      let out = a.mul(x).add(b);
      out.grad = 2 * (out.value - f(x));

      out.computeGradientsBackward();

      a.value -= learningRate * a.grad;
      b.value -= learningRate * b.grad;
      a.grad = b.grad = 0;
    }
  }
  t.ok(Math.abs(a.value - trueA) < 0.1, 'a.value');
  t.ok(Math.abs(b.value - trueB) < 0.1, 'b.value');
  t.end();
});

test('can multiply self', (t) => {
  let a = new Parameter(4);
  let out = a.mul(a);
  t.equal(out.value, 4 * 4)
  out.grad = 5;
  out.computeGradientsBackward();
  t.equal(a.grad, 8 * 5)
  t.end();
});

test('cosine approximation', (t) => {
  let f = (x) => x * x * x * 0.025 + x * x * 0.2;

  let learningRate = 0.01;
  let seeds = [];
  let octaveCount = 8;
  let range = 3;
  let xSteps = 10;
  let dx = range / xSteps;

  for (let j = 0; j < octaveCount; ++j) {
    seeds.push({
      a: new Parameter(Math.random()),
      b: new Parameter(Math.random()),
    })
  }

  let loss = 0;
  let bias = new Parameter(Math.random());
  for (let i = 0; i < 200; ++i) {
    loss = 0;
    let x = 0;
    for (let k = 0; k < xSteps; k += 1) {
      let out = bias;
      for (let j = 0; j < octaveCount; ++j) {
        let {a, b} = seeds[j];
        let c = (new Parameter(2 * Math.PI * x * (j + 1)/range)).add(b);
        let octaveOut = a.mul(c.cos());
        if (!out) out = octaveOut;
        else out = out.add(octaveOut);
      }

      let delta = out.value - f(x);
      out.grad = 2 * delta;
      loss += delta * delta;

      out.computeGradientsBackward();

      bias.value -= learningRate * bias.grad;
      bias.grad = 0;
      for (let j = 0; j < octaveCount; ++j) {
        let {a, b} = seeds[j];
        a.value -= learningRate * a.grad;
        b.value -= learningRate * b.grad;
        a.grad = b.grad = 0;
      }
      x += dx;
    }
    loss /= xSteps;
  }
  t.ok(loss < 1e-3, 'Loss is minimal')
  t.end();
});