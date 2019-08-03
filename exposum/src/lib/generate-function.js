const {useDecimal} = require('./config');
let generateFunction = generateRandomSum;
generateFunction = generateRandomPeriod;
generateFunction = generateSimplePeriod;

function generateRandomSum() {
  return `x/${getDivider()} + x*x*x/${getDivider()}`;
}

function generateRandomPeriod() {
  return `x/${getDivider()} + cos(x*${getDivider()}/PI)+ sin(x*${getDivider()}/PI)`;
}

function generateSimplePeriod() {
  return `x/${getDivider(85)} + cos(x*${getDivider(100, 1000)})`;
}

function getDivider(cap = 100, exponent = 0) {
  let value = Math.random() * cap + 2;
  let divider = exponent === 0 ? Math.round(value) : Math.round(value * exponent) / exponent;
  // k/32 + k*k*k/62 - eye
  // k/(6) + k * k * k /51;
  // x/21 + x*x*x/27;  -- impossible loop
  // k + k * k * k /35; // dog
  // k/39 + k*k*k/39; // another dog
  //   return k/8 + k*k*k/24004; -- clown
  // k/6 + k * k /7 + k * k * k/6 // running man
  // cross k/4 + k * k * k/18
  // apple logo k/6 + k * k /7 + k * k * k/14
  // candy k/24 + k * k * k/12;
  // k*k*k/101; // ram
  // mooseneckle   return k/90 + k * k * k/92;
  // scary monster k/3 + k * k * k/61;
  //   return k/3+Math.sin(k*2/Math.PI)+k * k/61;
  //   return k/3 + Math.sin(230*k/Math.E*Math.PI);  
    // return k/4+Math.sin(k*5/Math.PI);
    // x/3 + sin(x*45/PI) + sin(x*5/PI); // ring
// function f(k) {
//   return k/3+Math.sin(k*5/Math.PI);  
// }
  return divider;
}

module.exports = function generate() {
  return generateFunction();
}