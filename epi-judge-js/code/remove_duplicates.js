/**
 * Removes duplicates from a sorted array
 */
module.exports = function testCode(a) {
  let last = 0;
  for (let i = 1; i < a.length; ++i) {
    while (a[i] === a[i-1] && i < a.length) i++;
    if (i < a.length) {
      a[last + 1] = a[i];
      last += 1;
    }
  }
  return a.slice(0, last + 1)
}
