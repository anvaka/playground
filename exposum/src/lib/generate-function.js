function generateRandomSum() {
  return `k/${getDivider()} + k * k * k/${getDivider()}`;
}

function getDivider() {
  let divider = Math.round((Math.random() * 100 + 2));
  // k/(6) + k * k * k /51;
  // k + k * k * k /35; // dog
  // k/6 + k * k /7 + k * k * k/6 // running man
  // apple logo k/6 + k * k /7 + k * k * k/14
  //   return k/42 + k * k * k/18; 
  // if (Math.random() < 0.5) divider /= 100;
  return divider;
}

module.exports = function generate() {
  var vX = generateRandomSum();
  return `function f(k) {
  return ${vX};
}`;
}