var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var testCount = 2000;
var sum = testCount * (testCount - 1) / 2;

suite.add('Counting using Object.assign()', function() {
  var counter = {
    from: 0
  };

  for (var i = 0; i <= testCount; ++i) {
    Object.assign(counter, { from: counter.from + 1 });
  }

  if (counter.from !== testCount + 1) throw new Error('Math is wrong');
}).add('Counting using Object.assign() with new object', function() {
  var counter = {
    from: 0
  };

  for (var i = 0; i <= testCount; ++i) {
    counter = Object.assign({}, { from: counter.from + 1 });
  }

  if (counter.from !== testCount + 1) throw new Error('Math is wrong');
}).add('Counting using object spread', function() {
  var counter = {from: 0}

  for (var i = 0; i <= testCount; ++i) {
    counter = {...counter, from: counter.from + 1};
  }

  if (counter.from !== testCount + 1) throw new Error('Math is wrong');
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run();
