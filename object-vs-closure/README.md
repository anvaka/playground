# Comparing performance of `new` vs closure



``` js
# Which API is faster?

// Object
function AverageCounterObject() {
  this.sum = 0
  this.numbersCount = 0
}

AverageCounterObject.prototype = {
  add: function(number) { this.sum += number; this.numbersCount += 1 },
  get: function() { return this.sum / this.numbersCount }
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
```

Results surprised me. I'm running node `v6.3.0`

```
average counter Object x 235,494 ops/sec ±1.50% (79 runs sampled)
average counter function x 41,750 ops/sec ±1.90% (77 runs sampled)
```

Which means that function-based implementation is alsmos 7x slower than Object
