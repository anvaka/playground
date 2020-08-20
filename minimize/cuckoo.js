/**
 * Prototyping Cuckoo search.
 */
function findBest(options, inputGetEnergy) {
  let prevResults = new Map();
  let inputKeys = Object.keys(options.min);
  let Lb = getVectorFromOptions(options.min);
  let Ub = getVectorFromOptions(options.max);


  let best = cuckooSearch(25, 100, Lb, Ub, memoSearch);

  return getOptionsFromVector(best);

  function memoSearch(x) {
    let key = x.join(',');
    if (prevResults.has(key)) return prevResults.get(key);
    let val = inputGetEnergy(getOptionsFromVector(x));
    prevResults.set(key, val);
    return val;
  }

  function getOptionsFromVector(x) {
    return inputKeys.reduce((options, keyName, index) => {
      options[keyName] = x[index];
      return options;
    }, {});
  }

  function getVectorFromOptions(inputOptions) {
    return Object.keys(inputOptions).map(key => inputOptions[key]);
  }
}

let callCount = 0;
cuckooSearch(25, 1000, fill(0, 2), fill(50, 2), circle)
console.log(callCount)

function circle(x) {
  //return x.reduce((sum, v) => (v - 5) * (v - 5) + sum, 0);
  let a = 3;
  let b = 10
  callCount += 1;
  return Math.pow(a - x[0], 2) + b * Math.pow((x[1] - x[0] * x[0]), 2);
}


function cuckooSearch(populationSize, maxIterations, Lb, Ub, cb) {
  // let generator = require('ngraph.random')(42);
  let pa = 0.25;
  let allNests = [];
  let prevGeneration = [];
  let bestValue = Infinity;
  let bestNest;
  for (let j = 0; j < populationSize; ++j) {
    initNest(j);
  }

  for (let i = 0; i < maxIterations; ++i) {
    layCuckooEggs();
    transferGeneration();
    emptyNests();
    transferGeneration();

    if ((i % 100) === 0) {
      console.log('Iteration ', i);
      console.log('Best so far: ', bestNest.value, bestNest.egg)
    }
  }

  return bestNest.egg;

  function transferGeneration() {
    for (let j = 0; j < allNests.length; ++j) {
      copyEggFromTo(allNests[j], prevGeneration[j]);
    }
  }
  function layCuckooEggs() {
    // Get cuckoos by random walk/levy flights.
    let beta = 3 / 2;
    let sigma = Math.pow(
        gamma( 1 + beta ) * Math.sin(Math.PI * beta / 2) / 
          (gamma((1 + beta) / 2) * beta * Math.pow(2, (beta - 1) / 2)),
        1/beta
    );

    for (let i = 0; i < allNests.length; ++i) {
      let s = clone(prevGeneration[i].egg);
      // Levy flights by Mantegna's algorithm.
      // Based on https://www.amazon.com/Nature-Inspired-Optimization-Algorithms-Elsevier-Insights/dp/0124167438/?tag=wwwyasivcom-20
      let step = 0.01 * gaussian() * sigma / Math.pow(Math.abs(gaussian()), 1/beta);
      for (let j = 0; j < s.length; ++j) {
        s[j] = clamp(s[j] + step * (s[j] - bestNest.egg[j]) * gaussian(), Lb[j], Ub[j]);
      }
      layEgg(i, s);
    }
  }

  function gamma(z) {
    return Math.sqrt(2 * Math.PI / z) * Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z);
  }

  function emptyNests() {
    for (let i = 0; i < allNests.length; ++i) {
      if (nextDouble() > pa) {
        // Should probably use nests from the previous iteration, but this works too 
        let fromIndex = Math.floor(nextDouble() * allNests.length);
        let toIndex = Math.floor(nextDouble() * allNests.length);
        let s = minus(prevGeneration[fromIndex].egg, prevGeneration[toIndex].egg);
        let step = nextDouble() ;
        for (let j = 0; j < s.length; ++j) {
          s[j] = clamp(prevGeneration[i].egg[j] + s[j] * step, Lb[j], Ub[j]);
        }
        layEgg(i, s);
      }
    }
  }

  function initNest(nestIndex) {
    allNests[nestIndex] = {
      value: Infinity,
      egg: null
    };

    prevGeneration[nestIndex] = {
      value: Infinity,
      egg: null
    }
    layEgg(nestIndex, plus(Lb, times(minus(Ub, Lb), rand(Lb.length))));

    copyEggFromTo(allNests[nestIndex], prevGeneration[nestIndex]);
  }

  function copyEggFromTo(from, to) {
    to.value = from.value;
    to.egg = from.egg;
  }

  function layEgg(nestIndex, egg) {
      let eggValue = cb(egg)
      if (eggValue <= prevGeneration[nestIndex].value) {
        allNests[nestIndex].egg = egg;
        allNests[nestIndex].value = eggValue;

        if (eggValue < bestValue) {
          bestValue = eggValue;
          bestNest = allNests[nestIndex];
        }
      }
  }

  function rand(length) {
    let res = [];
    for (let i = 0; i < length; ++i) res.push(nextDouble())
    return res;
  }

  function gaussian() {
    // use the polar form of the Box-Muller transform
    // based on https://introcs.cs.princeton.edu/java/23recursion/StdRandom.java
    var r, x, y;
    do {
      x = nextDouble() * 2 - 1;
      y = nextDouble() * 2 - 1;
      r = x * x + y * y;
    } while (r >= 1 || r === 0);

    return x * Math.sqrt(-2 * Math.log(r)/r);
  }

  function nextDouble() {
    return Math.random();
    //return generator.nextDouble();
  }
}

function clone(v) {
  return v.slice();
}


function plus(a, b) {
  if (a.length !== b.length) throw new Error('Vector length mismatch')
  let res = [];
  for (let i = 0; i < a.length; ++i) {
    res[i] = a[i] + b[i]
  }
  return res;
}

function minus(a, b) {
  if (a.length !== b.length) throw new Error('Vector length mismatch')
  let res = [];
  for (let i = 0; i < a.length; ++i) {
    res[i] = a[i] - b[i]
  }
  return res;
}

function times(a, b) {
  if (a.length !== b.length) throw new Error('Vector length mismatch')
  let res = [];
  for (let i = 0; i < a.length; ++i) {
    res[i] = a[i] * b[i]
  }
  return res;
}

function fill(value, count) {
  let v = [];
  for (let i = 0; i < count; ++i) v[i] = typeof value === 'function' ? value() : value;
  return v;
}

function clamp(x, min, max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}
