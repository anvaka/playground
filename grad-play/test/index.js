import {test} from 'tap';
import {ComputationTree, Matrix} from '../grad.js';

test('it can multiply stuff', (t) => {
  let a = new Matrix(2, 2);
  let b = new Matrix(2, 1);
  a.data = [
    1, 2, 
    3, 4
  ];
  b.data = [
    1,
    2
  ];
  let out = new ComputationTree().mul(a, b);
  t.same(out.data, [5, 11])
  t.end();
});

test('it can add stuff', (t) => {
  let a = new Matrix(2, 2);
  let b = new Matrix(2, 2);
  a.data = [
    1, 2, 
    3, 4
  ];
  b.data = [
    1, 2,
    3, 4
  ];
  let out = new ComputationTree().add(a, b);
  t.same(out.data, [
    2, 4,
    6, 8
  ])
  t.end();
});

test('it can power2', t => {
  let x = new Matrix(1, 1);
  let G = new ComputationTree();
  x.data[0] = 4;
  let res = G.pow2(x);
  res.gradient[0] = 1;
  t.equal(res.data[0], 16);
  G.backprop();
  t.equal(x.gradient[0], 2 * 4);

  t.end();
});


test('it can add grad', t => {
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);
  let G = new ComputationTree();
  x.data[0] = 4;
  y.data[0] = 2;
  let res = G.add(x, y);
  res.gradient[0] = 1;

  t.equal(res.data[0], 6);
  G.backprop();
  t.equal(x.gradient[0], 1);
  t.equal(y.gradient[0], 1);

  t.end();
});

test('it can sub grad', t => {
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);
  let G = new ComputationTree();
  x.data[0] = 4;
  y.data[0] = 2;
  let res = G.sub(x, y);
  res.gradient[0] = 1;

  t.equal(res.data[0], 2);
  G.backprop();
  t.equal(x.gradient[0], 1);
  t.equal(y.gradient[0], -1);

  t.end();
});

test('it can sub pow', t => {
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);
  let G = new ComputationTree();
  x.data[0] = 4;
  y.data[0] = 2;
  let res = G.sub(G.pow2(x), y);
  res.gradient[0] = 1;

  // 4^2 - 2 = 14
  t.equal(res.data[0], 14);
  G.backprop();

  // 2 * 4
  t.equal(x.gradient[0], 8);

  t.equal(y.gradient[0], -1);

  t.end();
});

test('it can pow sub', t => {
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);
  let G = new ComputationTree();
  x.data[0] = 4;
  y.data[0] = 2;
  let res = G.pow2(G.sub(x, y));
  res.gradient[0] = 1;

  // (4 - 2)^2 = 4
  t.equal(res.data[0], 4);
  G.backprop();

  // 2 * (4 - 2) 
  t.equal(x.gradient[0], 4);

  // 2 * (4 - 2) * -1
  t.equal(y.gradient[0], -4);

  t.end();
});

// // This is not working as I expect
test('it can fit simple function', t => {
  // y = k * x + b, where k = 2, b = 3
  let k = new Matrix(1, 1);
  let b = new Matrix(1, 1);
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);


  k.data[0] = 1;///Math.random();
  b.data[0] = 1; //Math.random();
  x.data[0] = 1;

  let learningRate = 0.2;
  x.data[0] = 2;

  let G = new ComputationTree();
  y.data[0] = 2 * x.data[0] + 3;
  let res = G.pow2(G.sub(G.add(G.mul(k, x), b), y));
  t.equal(res.data[0], Math.pow(1 * 2 + 1 - (2 * 2 + 3), 2));
  res.gradient[0] = 1;
  G.backprop();
  t.equal(b.gradient[0], 2 * (1 * 2 + 1 - (2 * 2 + 3)));
  t.equal(k.gradient[0], 2 * 2 * (1 * 2 + 1 - (2 * 2 + 3)));
  t.end();
})

test('it fits', t => {
  // y = k * x + b, where k = 2, b = 3
  let k = new Matrix(1, 1);
  let b = new Matrix(1, 1);
  let x = new Matrix(1, 1);
  let y = new Matrix(1, 1);

  k.data[0] = Math.random(); 
  b.data[0] = Math.random(0);

  let learningRate = 0.02;

  for (let i = 0; i < 110; i++) {
    if ( i % 2 === 1) {
      x.data[0] = 2;
    } else {
      x.data[0] = 3;
    }
    y.data[0] = 2 * x.data[0] + 3;
    let G = new ComputationTree();
    let res = G.pow2(G.sub(G.add(G.mul(k, x), b), y));

    res.gradient[0] = 1;
    G.backprop();

    console.log(res.data[0]);
    
    let p = x.data[0]
    k.data[0] -= learningRate * k.gradient[0];
    b.data[0] -= learningRate * b.gradient[0];
    console.log(k.data[0], b.data[0]);

    k.resetGradient();
    b.resetGradient();
    // x.resetGradient();
    // y.resetGradient();
  }

  x.printDataMatrix();
  t.end();

});
