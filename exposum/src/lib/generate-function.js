const {useDecimal} = require('./config');
let generateFunction = useDecimal ? generateRandomDecimalSum : generateRandomSum;
generateFunction = generateRandomPeriod;

function generateRandomDecimalSum() {
  return `let kd = Decimal(k);
return kd.div(${getDivider()}).plus(kd.times(kd).times(kd).div(${getDivider()}))`;
}

function generateRandomSum() {
  return `return k/${getDivider()} + k*k*k/${getDivider()}`;
}

function generateRandomPeriod() {
  return `x/${getDivider()} + sin(x*${getDivider()}/PI)`;
}

function getDivider() {
  let divider = Math.round((Math.random() * 100 + 2));
  // k/32 + k*k*k/62 - eye
  // k/(6) + k * k * k /51;
  // k/21 + k*k*k/27;  -- impossible loop
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
    // return k/3 + Math.sin(k*45/Math.PI) + Math.sin(k*5/Math.PI); // ring
// function f(k) {
//   return k/3+Math.sin(k*5/Math.PI);  
// }
  return divider;
}

module.exports = function generate() {
  return generateFunction();
}