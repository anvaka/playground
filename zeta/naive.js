// Naive computation of zeta function

export function zetaReal(s, iterations = 1000) {
  let sum = 0;
  for (let n = 1; n < iterations; n++) {
    sum += 1 / Math.pow(n, s);
  }
  return sum;
}

export function zetaComplex(s, iterations = 1000) {
  let sum = { re: 0, im: 0 };
  for (let n = 1; n < iterations; n++) {
    const c = Math.pow(n, -s.re);
    sum.re += c * Math.cos(s.im * Math.log(n));
    sum.im += c * Math.sin(s.im * Math.log(n));
  }
  return sum;
}