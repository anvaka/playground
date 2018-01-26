var random = require('ngraph.random')();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function matrix(r, c) {
  var rows = [];

  var self = {
    isTransposed : false,
    rowsCount: r,
    colsCount: c,
    init,
    rows: rows,
    applyFunction,
    dot,
    print,
    toString,
    addVector,
    subVector,
    get, 
    set,
    transpose,
    view,
    norm
  };

  return self;

  function norm() {
    if (self.colsCount > 1) throw new Error('not supported yet');

    var sum = 0;
    for(var i = 0; i < self.rowsCount; ++i) {
      var x = self.get(i, 0);
      sum += x * x;
    }

    return Math.sqrt(sum);
  }

  function view(other, transposeIt) {
    self.rows = rows = other.rows;
    r = self.rowsCount = other.rowsCount;
    c = self.colsCount = other.colsCount;
    if (transposeIt) {
      r = self.rowsCount = other.colsCount;
      c = self.colsCount = other.rowsCount;
    }

    if (!other.isTransposed) {
      self.get = transposeGet;
      self.set = transposeSet;
    }

    self.isTransposed = transposeIt;

    return self;
  }

  function get(r, c) {
    if (r < 0 || r >= self.rowsCount ||
      c < 0 || c >= self.colsCount) throw new Error('out of range');
    return rows[r][c];
  }

  function set(r, c, v) {
    if (r < 0 || r >= self.rowsCount ||
      c < 0 || c >= self.colsCount) throw new Error('out of range');
    rows[r][c] = v;
  }

  function transposeGet(r, c) {
    if (r < 0 || r >= self.rowsCount ||
      c < 0 || c >= self.colsCount) throw new Error('out of range');
    return rows[c][r];
  }

  function transposeSet(r, c, v) {
    if (r < 0 || r >= self.rowsCount ||
      c < 0 || c >= self.colsCount) throw new Error('out of range');
    rows[c][r] = v;
  }


  function transpose() {
    return matrix(r, c).view(self, /* transposed */ true);
  }

  function addVector(other, inPlace) {
    if (other.colsCount > 1) throw new Error('not supported');

    if (inPlace) {
      for (var i = 0; i < self.rowsCount; ++i) {
        for (var j = 0; j < self.colsCount; ++j) {
          self.set(i, j, self.get(i, j) + other.get(i, 0));
        }
      }

      return self;
    }

    var result = matrix(r, c);

    result.init((row, col) => self.get(row, col) + other.get(row, 0));

    return result;
  }

  function subVector(other, inPlace) {
    if (other.colsCount > 1) throw new Error('not supported');

    if (inPlace) {
      for (var i = 0; i < self.rowsCount; ++i) {
        for (var j = 0; j < self.colsCount; ++j) {
          self.set(i, j, self.get(i, j) - other.get(i, 0));
        }
      }

      return self;
    }

    var result = matrix(r, c);

    result.init((row, col) => self.get(row, col) - other.get(row, 0));

    return result;
  }

  function print() {
    console.log(toString());
    return self;
  }

  function toString()  {
    var table = [];
    for (var i = 0; i < self.rowsCount; ++i) {
      var str = []
      for (var j = 0; j < self.colsCount; ++j) {
        str.push(self.get(i, j));
      }
      table.push(str.join('\t'));
    }
    table.join('\n');
    return table;
  }

  function dot(other) {
    if (self.colsCount !== other.rowsCount) throw new Error('dimension mismatch');

    var result = matrix(self.rowsCount, other.colsCount);
    result.init((r, c) => {
      var result = 0;
      for (var i = 0; i < self.colsCount; ++i) {
        result += self.get(r, i) * other.get(i, c)
      }
      return result;
    });
    return result;
  }

  function init(cb) {
    if (Array.isArray(cb)) {
      var arr = cb;
      cb = (row, col) => arr[row][col];
    }

    if (!cb) cb = zero;

    for (var i = 0; i < r; ++i) {
      var row = [];
      rows.push(row);
      for (var j = 0; j < c; ++j) {
        row.push(cb(i, j));
      }
    }

    return self;
  }

  function applyFunction(cb, inPlace) {
    if (inPlace) {
      for (var i = 0; i < r; ++i) {
        for (var j = 0; j < c; ++j) {
          if (self.isTransposed) {
            throw 'nooo';
          }
          self.set(i, j, cb(self.get(i, j), i, j));
        }
      }

      return self;
    }

    var result = matrix(r, c);
    result.init((r, c) => cb(self.get(r, c), r, c));

    return result;
  }

  function zero() { return 0; }
}

function createNetwork(sizes) {
  var numLayers = sizes.length;
  var biases = [];
  var weights = [];
  
  for (var i = 1; i < numLayers; ++i) {
    var bMatrix = matrix(sizes[i], 1).init(gaussian);
    biases.push(bMatrix);

    var wMatirx = matrix(sizes[i], sizes[i - 1]).init(gaussian);
    weights.push(wMatirx);
  }

  return {
    getNet() {
      return {weights, biases};
    },
    feedForward,
    backProp,
    sgd
  };

  function sgd(trainData, epochs, miniBatchSize, eta, testData) {
    for (var j = 0; j < epochs; ++j) {
      shuffle(trainData);

      var miniBatches = generateBatches(trainData, miniBatchSize);
      miniBatches.forEach(mini => updateMiniBatch(mini, eta));
      if (testData) {
        console.log(`Epoch ${j}: ${evaluate(testData)} / ${testData.length}`);
      }
    }
  }

  function evaluate(testData) {
    var diff = 0;
    testData.forEach(d => {
      diff += feedForward(d.x).subVector(d.y).norm()
    })
    return diff/testData.length;
  }

  function generateBatches(arr, miniBatchSize) {
    var minis = [];
    for (var i = 0; i < arr.length; i += miniBatchSize) minis.push(arr.slice(i, i + miniBatchSize));
    return minis;
  }

  // """Update the network's weights and biases by applying
  // gradient descent using backpropagation to a single mini batch.
  // The ``mini_batch`` is a list of tuples ``(x, y)``, and ``eta``
  // is the learning rate."""
 function updateMiniBatch(mini_batch, eta) {
    var {nabla_b, nabla_w } = initNablas();

    mini_batch.forEach(tuple => {
      var {x, y} = tuple;
      var {nabla_b: delta_nabla_b, nabla_w: delta_nabla_w} = backProp(x, y);
      var size = nabla_b.length;
      for (var i = 0; i < size; ++i) {
        var db = delta_nabla_b[i], dw = delta_nabla_w[i];
        nabla_b[i].applyFunction((v, row, col) => v + db.get(row, col),/* inplace */ true);
        nabla_w[i].applyFunction((v, row, col) => v + dw.get(row, col),/* inplace */ true);
      }
    });

    var batchSize = mini_batch.length;

    for (var i = 0; i < weights.length; ++i) {
      var w = weights[i], nw = nabla_w[i];
      w.applyFunction((x, row, col) => {
        return x - eta * nw.get(row, col)/batchSize;
      }, /* inplace */ true);

      var b = biases[i], nb = nabla_b[i];

      b.applyFunction((x, row, col) => {
        return x - eta * nb.get(row, col)/batchSize;
      }, /* inplace */ true);
    }
  }

  function initNablas() {
    var size = biases.length
    var nabla_b = new Array(size), nabla_w = new Array(size), i, w, b;
    for (i = 0; i < size; ++i) {
      b = biases[i], w = weights[i];
      nabla_b[i] = (matrix(b.rowsCount, b.colsCount).init());
      nabla_w[i] = (matrix(w.rowsCount, w.colsCount).init());
    }

    return {nabla_b, nabla_w};
  }

  function backProp(x, y) {
    var size = biases.length
    var i, w, b;
    var {nabla_b, nabla_w } = initNablas();

    // forward pass
    var activation = x;
    var activations = [activation]; // list to store all the activations, layer by layer
    var zs = []; // list to store all z vectors

    for(i = 0; i < size; ++i) {
      var b = biases[i], w = weights[i];
      var z = w.dot(activation).addVector(b, /* inplace = */ true);
      zs.push(z);
      if (i === size - 1) {
        activation = z.applyFunction(x => x);
      } else {
        activation = z.applyFunction(sigmoid);
      }

      activations.push(activation);
    }

    // backward pass
    var delta = costDerivative(activation, y).applyFunction((o, row, col) => {
      if (col > 0) throw 'what';
      return z.get(row, 0);
      //return o * sigmoidPrime(z.get(row, 0));
    }, /* inplace = */ true);

    nabla_b[size - 1] = delta;
    nabla_w[size - 1] = delta.dot(activations[activations.length - 2].transpose());
    for (var l = 2; l < numLayers; ++l) {
      z = zs[size - l];
      delta = weights[size - l + 1].transpose().dot(delta).applyFunction((x, row, col) => {
        if (col > 0) throw 'what';
        return x * sigmoidPrime(z.get(row, 0))
      }, /* inplace */ true);

      nabla_b[size - l] = delta
      nabla_w[size - l] = delta.dot(activations[activations.length - l - 1].transpose());
    }
    return {
      nabla_b, nabla_w
    }
  }

  function costDerivative(a, y) {
    return a.subVector(y);
  } 

  function feedForward(a) {
    var res = (a);

    for (var i = 0; i < weights.length; ++i) {
      var w = weights[i], b = biases[i];
      res = w.dot(res).addVector(b, /* inplace = */ true).applyFunction(sigmoid, /* inPlace  */ true);
    }

    return res;
  }
}

function sigmoid(z) {
 return 1.0/(1.0 + Math.exp(-z));
}

function sigmoidPrime(z) {
  var zs = sigmoid(z);
  return zs*(1-zs);
}

function gaussian() { return random.gaussian(); }

var nn = createNetwork([1, 2, 1]);

var trainData = []
for (var i = 0; i < 2000; ++i) {
  var x = random.gaussian();
  
  trainData.push({
    x: matrix(1, 1).init([[x]]),
    y: matrix(1, 1).init([[100*x]])
  })
}
var testData = []
for (var i = 0; i < 200; ++i) {
  var x = random.gaussian();
  
  testData.push({
    x: matrix(1, 1).init([[x]]),
    y: matrix(1, 1).init([[100*x]])
  })
}

nn.sgd(trainData, 30, 10, 0.1, testData);

for (var i = 0; i < 20; ++i) {
  var x = random.gaussian();
  console.log('trying x', x);
  var input = matrix(1, 1).init([[x]]);
  nn.feedForward(input).print()
}


// nn.getNet().weights.forEach((w, idx) => {
//   console.log('Level ' + idx + ' weights:')
//   w.print();
// })