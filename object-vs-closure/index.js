var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var testCount = 2000;
var sum = testCount * (testCount + 1) / 2;
var expectedAverage = sum / (testCount + 1);

// newable object
function AverageCounterObject() {
  this.sum = 0;
  this.numbersCount = 0;
}

AverageCounterObject.prototype = {
  add: function(number) { this.sum += number; this.numbersCount += 1; },
  get: function() { return this.sum / this.numbersCount; }
};

// closure
function averageCounterFunction() {
  var sum = 0;
  var numbersCount = 0;

  return {
    add: function(number) { sum += number; numbersCount += 1; },
    get: function() { return sum / numbersCount; }
  }
}

// symbol (private object)
var AverageCounterObjectSymbol = (function() {
  var _sum = Symbol('sum');
  var _count = Symbol('number-count');

  function AverageCounterObjectSymbol() {
      this[_sum] = this[_count] = 0;
  }

  AverageCounterObjectSymbol.prototype = {
    add: function(number) { this[_sum] += number; this[_count] += 1; },
    get: function() { return this[_sum] / this[_count]; }
  };

  return AverageCounterObjectSymbol
})()

// reusing functions, as suggested here https://www.reddit.com/r/javascript/comments/5fxkx1/til_in_chrome_calling_new_foo_is_faster_than/daoxqbh/
function averageCounterReusedFunction() {
  return {
    sum: 0,
    parts: 0,
    add: averagerAdd,
    get: averagerGet,
  };
}

function averagerAdd(number) {
  this.sum += number;
  this.parts += 1;
}

function averagerGet() {
  return this.sum / this.parts;
}

suite.add('average counter Object', function() {
  var counter = new AverageCounterObject();

  for (var i = 0; i <= testCount; ++i) {
    counter.add(i);
  }

  if (counter.get() !== expectedAverage) throw new Error('Math is wrong');
}).add('average counter Object with private symbols', function() {
  var counter = new AverageCounterObjectSymbol();

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
}).add('average counter reused function', function() {
  var counter = averageCounterReusedFunction();

  for (var i = 0; i <= testCount; ++i) {
    counter.add(i);
  }

  if (counter.get() !== expectedAverage) throw new Error('Math is wrong');
})
.on('cycle', function(event) {
  console.log(String(event.target));
}).run();
