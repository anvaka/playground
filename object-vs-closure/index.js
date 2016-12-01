var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var testCount = 2000;
var sum = testCount * (testCount + 1) / 2;
var expectedAverage = sum / (testCount + 1);

function AverageCounterObject() {
  this.sum = 0;
  this.numbersCount = 0;
}

AverageCounterObject.prototype = {
  add: function(number) { this.sum += number; this.numbersCount += 1; },
  get: function() { return this.sum / this.numbersCount; }
};

function averageCounterFunction() {
  var sum = 0;
  var numbersCount = 0;

  return {
    add: function(number) { sum += number; numbersCount += 1; },
    get: function() { return sum / numbersCount; }
  }
}

suite.add('average counter Object', function() {
  var counter = new AverageCounterObject();

  for (var i = 0; i <= testCount; ++i) {
    counter.add(i);
  }

  if (counter.get() !== expectedAverage) throw new Error('Math is wrong');
}).add('average counter function', function() {
  var counter = averageCounterFunction();

  for (var i = 0; i <= testCount; ++i) {
    counter.add(i);
  }

  if (counter.get() !== expectedAverage) throw new Error('Math is wrong');
})
.on('cycle', function(event) {
  console.log(String(event.target));
}).run();
