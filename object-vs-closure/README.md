# Comparing performance of `new` vs closure

``` js
// # Which API is faster?

// Object
function AverageCounterObject() {
  this.sum = 0
  this.numbersCount = 0
}

AverageCounterObject.prototype = {
  add: function(number) { this.sum += number; this.numbersCount += 1 },
  get: function() { return this.sum / this.numbersCount }
}

// Class
class ClassCounter {
  constructor() {
    this.sum = 0;
    this.numbersCount = 0;
  }

  get() {
    return this.sum / this.numbersCount;
  }

  add(number) {
    this.sum += number;
    this.numbersCount += 1;
  }
}

// or function:
function averageCounterFunction() {
  var sum = 0
  var numbersCount = 0

  return {
    add: function(number) { sum += number; numbersCount += 1 },
    get: function() { return sum / numbersCount }
  }
}

// or reused function:
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
```

I'm running node `v13.2.0`

```
average counter Object x 207,897 ops/sec ±0.89% (93 runs sampled)
average counter class Object x 209,052 ops/sec ±0.89% (95 runs sampled)
average counter function x 66,186 ops/sec ±2.22% (89 runs sampled)
average counter reused function x 207,143 ops/sec ±1.06% (89 runs sampled)
```

Which means that function-based closures is alsmost 3x slower than `this` based
access.

Browse throw the code to see different variations/optimizations of each method:
https://github.com/anvaka/playground/blob/master/object-vs-closure/index.js
