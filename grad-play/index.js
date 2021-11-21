/**
 * Just playing with various gradient descent methods.
 */

let f = (x) => x ** 2; // Math.sin(x * .2);
let df = (x) => 2 * x; // Math.cos(x * .2) * .2;
// let f = (x) => x * x;
// let df = (x) => 2 * x;
let startingPoint = 1;

findMinimumWithGradientDescent(startingPoint, f, df, 0.2, 100);
//findMinimumWithAdadelta(startingPoint, f, df, 0.2, 100);
// findMinimumWithMomentum(startingPoint, f, df, 1, 40);
// findMinimumWithRMSProp(startingPoint, f, df, 0.2, 100);
// findMinimumWithAdam(startingPoint, f, df, 0.2, 100);
// findMinimumWithAdagrad(startingPoint, f, df, 0.2, 100);

function findMinimumWithGradientDescent(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
    let x = startAt;
    console.log('Regular gradient descent')
    for(let i = 0; i < iterationCount; ++i) {
      let gradient = df(x);
      let oldX = x;
      x -= gradient * learningRate
      console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
    }
}

function findMinimumWithMomentum(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
  // https://www.youtube.com/watch?v=k8fTYJPd3_I
  let x = startAt;
  let beta = 0.9; // momentum. We use 90% of the old movement change and 10% of the new gradient;
  let dX = 0;
  console.log('Momentum gradient descent')
  for(let i = 0; i < iterationCount; ++i) {
    let gradient = df(x);
    dX = beta * dX - learningRate * gradient * (1 - beta);
    x += dX;
    console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
  }
}

function findMinimumWithRMSProp(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
    // https://www.youtube.com/watch?v=_e-LFe_igno
    var x = startAt;
    console.log('RMSProp gradient descent')
    let sD = 0;
    let beta = 0.9;

    for(let i = 0; i < iterationCount; ++i) {
      let gradient = df(x);
      sD = beta * sD + (1 - beta) * gradient * gradient;
      x -= learningRate * gradient / Math.sqrt(sD + 1e-8);

      console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
    }
}

function findMinimumWithAdam(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
    // https://www.youtube.com/watch?v=JXQT_vxqwIs
    var x = startAt;
    console.log('Adam gradient descent (RMSProp + Momentum)')
    let sD = 0;
    let vD = 0;
    let beta1 = 0.9;
    let beta2 = 0.999;
    let beta1Corrected = beta1;
    let beta2Corrected = beta2;

    for(let i = 0; i < iterationCount; ++i) {
      let gradient = df(x);

      vD = beta1 * vD + (1 - beta1) * gradient;            // "momentum" update
      sD = beta2 * sD + (1 - beta2) * gradient * gradient; // "RMSProp" update
      let vCorrected = vD / (1 - beta1Corrected);
      let sCorrected = sD / (1 - beta2Corrected);

      beta1Corrected *= beta1;
      beta2Corrected *= beta2;

      x -= learningRate * vCorrected / (Math.sqrt(sCorrected) + 1e-8);

      console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
    }
}

function findMinimumWithAdadelta(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
    // https://arxiv.org/pdf/1212.5701.pdf
    // NB: Learning rate is ignored, but kept for interface compatibility.

    var x = startAt;
    console.log('Adadelta')
    let sD = 0;

    let beta2 = 0.9999;
    let dx = 0;
    let eps = 1e-8;
    let sE = Math.sqrt(dx + eps);

    for(let i = 0; i < iterationCount; ++i) {
      let gradient = df(x);

      sD = beta2 * sD + (1 - beta2) * gradient * gradient;
      dx = -Math.sqrt(sE + eps) / Math.sqrt(sD + eps) * gradient;
      sE = beta2 * sE + (1 - beta2) * dx * dx;

      x += dx;

      console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
    }
}

function findMinimumWithAdagrad(startAt, f, df, learningRate = 0.1, iterationCount = 10) {
    // Section 2.2.2. of https://arxiv.org/pdf/1212.5701.pdf 
    var x = startAt;
    console.log('Adagrad')
    let gradientSquaredSum = 0;

    for(let i = 0; i < iterationCount; ++i) {
      let gradient = df(x);

      // looks similar to RMSProp:
      gradientSquaredSum += gradient * gradient;
      x -= learningRate * gradient / Math.sqrt(gradientSquaredSum + 1e-8);

      console.log('Step: ' + i + '; gradient (' + oldX + ') = ' + df(oldX) + '; newX = ' + x + ' F(oldX) = ' + f(oldX) );
    }
}