const {useDecimal} = require('./config');
let generateRandomSum = useDecimal ? generateRandomDecimalSum : generateRandomSum;

function generateRandomDecimalSum() {
  return `let kd = Decimal(k);
return kd.div(${getDivider()}).plus(kd.times(kd).times(kd).div(${getDivider()}))`;
}

function generateRandomSum() {
  return `return k/${getDivider()} + k*k*k/${getDivider()}`;
}

function getDivider() {
  let divider = Math.round((Math.random() * 100 + 2));
  // k/(6) + k * k * k /51;
  // k/21 + k*k*k/27;  -- impossible loop
  // k + k * k * k /35; // dog
  // k/6 + k * k /7 + k * k * k/6 // running man
  // cross k/4 + k * k * k/18
  // apple logo k/6 + k * k /7 + k * k * k/14
  // candy k/24 + k * k * k/12;
  // k*k*k/101; // ram
  // mooseneckle   return k/90 + k * k * k/92;
  // scary monster k/3 + k * k * k/61;
  //   return k/42 + k * k * k/18; 
  // if (Math.random() < 0.5) divider /= 100;
  return divider;
}

module.exports = function generate() {
  var vX = generateRandomSum();
  return `function f(k) {
  ${vX};
}`;
}