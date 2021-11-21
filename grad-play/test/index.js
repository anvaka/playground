
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
})

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

// This is not working as I expect
// test('it can fit simple function', t => {
//   // y = k * x + b, where k = 2, b = 3
//   let k = new Matrix(1, 1);
//   let b = new Matrix(1, 1);
//   let x = new Matrix(1, 1);


//   k.data[0] = 1;///Math.random();
//   b.data[0] = 1; //Math.random();
//   x.data[0] = 1;

//   let learningRate = 0.2;
//   x.data[0] = 1;
//   for (let i = 0; i < 100; i++) {

//     let G = new ComputationTree();
//     let res = G.mul(x, x);

//     res.gradient[0] = 2 * res.data[0]; //  - expectedValue);
//     G.backprop();

//     let p = x.data[0]
//     x.data[0] -= learningRate * res.gradient[0];

//     console.log('Step: ' + i + '; gradient (' + p + ') = ' + res.gradient[0] + '; newX = ' + x.data[0] + ' F(oldX) = ' + res.data[0] );

//     x.resetGradient();
//     //x.printDataMatrix();
//     // b.data[0] -= learningRate * b.gradient[0];
//     // k.resetGradient();
//     // b.resetGradient();
//   }
  
//   x.printDataMatrix();
//   t.end();
// })