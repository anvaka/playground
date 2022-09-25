# Comparing performance of Object.assign() vs {...}

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