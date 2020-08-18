/**
 * Nelder–Mead optimization method 
 * https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method
 * 
 * It could be used like this to find best parameters of a graph layout:
 * 
 * findMinimum(options => {
 *    let layout = createLayout(graph, options);
 *    for (let i = 0; i < 200; ++i) layout.step();
 *    return layout.getForceVectorLength(); // current energy.
 *  }, { // default inputs
 *    gravity: -10,
 *    springLength: 10,
 *    adaptiveTimeStepWeight: 0.05
 * });
 */
function findMinimum(inputGetEnergy, inputOptions, initialDelta) {
  let inputKeys = Object.keys(inputOptions);

  let startPoint = getVectorFromOptions();
  let deltaVectors = getDeltaVectors(inputKeys, initialDelta);
  let res = minimize(memoEnergy, startPoint, 2000, (i) => {
    let deltaVector = deltaVectors[i];
    if (!deltaVector) throw new Error('No vector for index ' + i);
    return deltaVector;
  });

  return getOptionsFromVector(res);

  function getVectorFromOptions() {
    return inputKeys.map(key => inputOptions[key]);
  }

  function memoEnergy(x) {
    if (x.__val) return x.__val;
    x.__val = inputGetEnergy(getOptionsFromVector(x));
    return x.__val;
  }

  function getOptionsFromVector(x) {
    return inputKeys.reduce((options, keyName, index) => {
      options[keyName] = x[index];
      return options;
    }, {});
  }

  function getDeltaVectors(inputKeys, initialDelta) {
    let inputKeyToIndex = new Map();
    inputKeys.forEach((key, index) => inputKeyToIndex.set(key, index));
    let clone = getVectorFromOptions(inputKeys);

    return inputKeys.map((key, index) => {
      let result = clone.slice();
      if (initialDelta && initialDelta[key] !== undefined) {
        result[index] += initialDelta[key];
      } else {
        result[index] += result[index] * 0.1;
      }
      return result;
    })
  }
}

function minimize(f, start, iterationCount, getNext) {
  let alpha = 1;
  let gamma = 2;
  let ro = 0.5;
  let sigma = 0.5;
  let step = 1;
  let dimensions = start.length;
  let points = [start];

  for (let i = 0; i < dimensions; ++i) {
    if (getNext) {
      points.push(getNext(i, start));
    } else {
      let next = start.map(x => x);
      next[i] += step;
      points.push(next);
    }
  }
  console.log('starting minimization with ', start)
//   let values = points.map(xn => f(xn)); 
  for (let j = 0; j < iterationCount; ++j) {
    points.sort((a, b) => f(a) - f(b));
    let diff = f(points[points.length - 1]) - f(points[0]);
    if (diff < 1e-4) break;
    console.log('best so far ',  f(points[0]));
    let centroid = getCentroid(points);
    // Reflection
    let reflection = getReflection(centroid, points[points.length - 1]);
    if (
        f(points[0]) <= f(reflection) && 
        f(reflection) < f(points[points.length - 2])
    ) {
      //  reflected point is better than the second  worst but not better the
      // the best:
      points[points.length - 1] = reflection;
      continue;
    }
    
    // expansion
    if (f(reflection) < f(points[0])) {
      let expanded = getExpanded(centroid, reflection);
      if (f(expanded) < f(reflection)) {
        // replace the worst with expanded:
        points[points.length - 1] = expanded;
      } else {
        points[points.length - 1] = reflection;
      }
      continue;
    }
    // contraction
    let contracted = getContracted(centroid, points[points.length - 1]);
    if (f(contracted) < f(points[points.length - 1])) {
      points[points.length - 1] = contracted;
      continue;
    }
    
    // shrink
    for (let i = 1; i < points.length; ++i) {
      points[i] = getShrink(points[0], points[i]);
    }
  } 

  
  return points[0];
  
  function getCentroid(points) {
    let center = (new Array(dimensions)).fill(0);
    for (let i = 0; i < points.length - 1; ++i) {
      let p = points[i];
      p.forEach((x, i) => {center[i] += x;})
    }
    for (let i = 0; i < dimensions; ++i) {
      center[i] /= (points.length - 1);
    }
    return center;
  }
  function getShrink(best, other) {
    let srunk = (new Array(dimensions));
    for (let i = 0; i < dimensions; ++i) {
        srunk[i] = best[i] + sigma * (other[i] - best[i]);
    }
    return srunk;
  }
  
  function getReflection(centroid, worst_point) {
    let reflection = (new Array(dimensions));
    for (let i = 0; i < dimensions; ++i) {
        reflection[i] = centroid[i] + alpha * (centroid[i] - worst_point[i]);
    }
    return reflection;
  }

  function getContracted(centroid, worst_point) {
    let contracted = (new Array(dimensions));
    for (let i = 0; i < dimensions; ++i) {
        contracted[i] = centroid[i] + ro * (worst_point[i] - centroid[i]);
    }
    return contracted;
  }

  
  function getExpanded(centroid, reflection) {
    let expanded = (new Array(dimensions));
    for (let i = 0; i < dimensions; ++i) {
        expanded[i] = centroid[i] + gamma * (reflection[i] - centroid[i]);
    }
    return expanded;
  }

}