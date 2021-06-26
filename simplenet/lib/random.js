export default class Random {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    let seed = this.seed;
    // Robert Jenkins' 32 bit integer hash function.
    seed = ((seed + 0x7ed55d16) + (seed << 12)) & 0xffffffff;
    seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
    seed = ((seed + 0x165667b1) + (seed << 5)) & 0xffffffff;
    seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
    seed = ((seed + 0xfd7046c5) + (seed << 3)) & 0xffffffff;
    seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
    this.seed = seed;

    return (seed & 0xfffffff) / 0x10000000;
  }

  gaussian() {
    // use the polar form of the Box-Muller transform
    // based on https://introcs.cs.princeton.edu/java/23recursion/StdRandom.java
    let r, x, y;
    do {
      x = this.next() * 2 - 1;
      y = this.next() * 2 - 1;
      r = x * x + y * y;
    } while (r >= 1 || r === 0);

    return x * Math.sqrt(-2 * Math.log(r)/r);
  }

  forEach(array, cb) {
    let i, j, t;
    for (i = array.length - 1; i > 0; --i) {
      j = Math.floor(this.next() * (i + 1)); // i inclusive
      t = array[j];
      array[j] = array[i];
      array[i] = t;

      cb(t);
    }

    if (array.length) {
      cb(array[0]);
    }
  }
}