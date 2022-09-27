# Various micro benchmarks

## Comparing performance of Object.assign() vs {...}

[spread_vs_assign.js](spread_vs_assign.js)

``` js
// # Which API is faster?
// Object.assign()
  Object.assign(counter, { from: counter.from + 1 });
// Or Object.assign() with new object
  counter = Object.assign({}, { from: counter.from + 1 });
// or using object spread
  counter = { ...counter, from: counter.from + 1 };
```

I'm running node `v16.4.0`

```
Counting using Object.assign() x 17,037 ops/sec ±4.86% (89 runs sampled)
Counting using Object.assign() with new object x 11,776 ops/sec ±1.61% (93 runs sampled)
Counting using object spread x 8,083 ops/sec ±2.62% (86 runs sampled)
```

Object.assign() is almost two times faster than spread.

## Comparing object vs closure

[object-vs-closure.js](object-vs-closure.js)

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

I'm running node `v16.4.0`

```
average counter Object x 205,963 ops/sec ±0.57% (95 runs sampled)
average counter Object with private symbols x 204,035 ops/sec ±1.32% (89 runs sampled)
average counter class Object x 207,643 ops/sec ±0.71% (94 runs sampled)
average counter function x 214,079 ops/sec ±0.56% (91 runs sampled)
average counter reused function x 209,223 ops/sec ±0.44% (98 runs sampled)
```

Which means that they are all mostly the same