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
    const realPart = Math.pow(n, -s.re) * Math.cos(-s.im * Math.log(n));
    const imPart = Math.pow(n, -s.re) * Math.sin(-s.im * Math.log(n));
    sum.im += imPart;
    sum.re += realPart;
  }
  return sum;
}

function zetaComplex(s, iterations = 1000) {
  let sum = { re: math.bignumber(0), im: math.bignumber(0) };
  for (let n = 1; n < iterations; n++) {
    const realPart = math.multiply(
        math.pow(n, math.bignumber(math.subtract(0, s.re))), 
        math.cos(math.multiply(math.bignumber(math.subtract(0, s.im)), math.log(n)))
    );
    const imPart = math.multiply(
      math.pow(n, math.bignumber(math.subtract(0, s.re))) , 
      math.sin(math.multiply(math.bignumber(math.subtract(0, s.im)), math.log(n)))
    );
    sum.im = math.bignumber(math.add(sum.im, imPart));
    sum.re = math.bignumber(math.add(sum.re, realPart));
  }
  return sum;
}