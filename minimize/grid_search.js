/**
 * Performs grid search between  min/max objects
 * and a given function.
 * 
 * E.g. this code will try to find best layout options
 * for a graph layout:
 * 
 *  let layoutOptions = gridSearch({
 *    min: {
 *      adaptiveTimeStepWeight: 0.05,
 *      springCoeff: 0.01,
 *      dragCoeff: 1.2,
 *    },
 *    max: {
 *      adaptiveTimeStepWeight: 0.1,
 *      springCoeff: 1,
 *      dragCoeff: 2.2,
 *    },
 *    // How many points (including min/max) each parameter
 *    // should be probed for:
 *    delta: {
 *      adaptiveTimeStepWeight: 4,
 *      springCoeff: 10,
 *      dragCoeff: 10
 *    }
 *  }, options => {
 *    let layout = createLayout(graph, getMergedOptions(options));
 *    for (let i = 0; i < 200; ++i) layout.step();
 *    return layout.getForceVectorLength();
 *  })
 */
function gridSearch(params, getEnergy) {
  let {min, max, delta} = params;
  let minSet = new Set(Object.keys(min));
  let inputKeys = Object.keys(max);
  if (inputKeys.length !== minSet.size) throw new Error('min and max should have the same keys');
  
  inputKeys.forEach(key => {
    if (!minSet.has(key)) throw new Error('Unpaired key: ' + key);
  });
  
  let minOptions = getVectorFromOptions(min);
  let maxOptions = getVectorFromOptions(max);
  let split = minOptions.map((minValue, index) => {
    let maxValue = maxOptions[index];
    let n = getSplitCountForIndex(index);
    if (n < 3) return [minValue, maxValue];
    let s = (maxValue - minValue) / (n - 1);
    let res = [];
    for (let i = 0; i < n; ++i) {
      res.push(minValue + s * i);
    }
    return res;
  });

  let q = createMinQueue(3);
  getPermutations(split, 0, [], arr => {
    let v = getOptionsFromVector(arr)
    let energy = getEnergy(v);
    q.add(v, energy);
  })

  let buff = q.getBuffer();
  console.log(buff);
  
  return buff[0].value;

  function getSplitCountForIndex(index) {
    if (Number.isFinite(delta)) return delta;
    return delta[inputKeys[index]] || 0;
  }
  
  function getVectorFromOptions(inputOptions) {
    return Object.keys(inputOptions).map(key => inputOptions[key]);
  }
  
  function getOptionsFromVector(x) {
    return inputKeys.reduce((options, keyName, index) => {
      options[keyName] = x[index];
      return options;
    }, {});
  }
}

function getPermutations(a, offset, path, visit) {
  if (offset === a.length) {
    visit(path);
    return;
  }
  
  let current = a[offset];
  for (let i = 0; i < current.length; ++i) {
    path.push(current[i]);
    getPermutations(a, offset + 1, path, visit);
    path.pop();
  }
}

function createMinQueue(n) {
  let buffer = new Array();
  return {
    add: add,
    getBuffer() { return buffer;}
  }

  function add(value, score) {
    if (buffer.length === n && score > buffer[buffer.length - 1].score) return;

    buffer.push({value, score});
    let smallest = buffer[0];
    buffer.sort((a, b) => a.score - b.score);
    if (smallest !== buffer[0]) {
      console.log('Min so far: ', buffer[0].value, buffer[0].score);
    }
    buffer = buffer.slice(0, n);
  }
}
