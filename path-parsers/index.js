var parseSVG = require('svg-path-parser');
var parse = require("d-path-parser");
var Benchmark = require('benchmark');

var d='M437472,687342L438644,686169L437472,684997L437472,681479L440990,677961L444509,677961L445681,676788L450373,681479L452718,681479L453891,682651L455064,682651L456237,683824L452718,687342L452718,688514L451546,689687L451546,690860L450373,692032L449200,692032L445681,695550L444509,695550L440990,699068L439817,697896L439817,692032L438644,690860L438644,688514L437472,687342Z'
var suite = new Benchmark.Suite;
let counters = {
  parseSVG: 0,
  my: 0,
  myFast: 0,
  dp: 0,
  it: 0
}

const characterLookup = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9
}

class NumberParser {
  constructor() {
    this.value = 0;
    this.hasValue = false;
    this.isNegative = false;
  }
  getValue() {
    return this.isNegative ? -this.value : this.value;
  }
  reset() {
    this.hasValue = false;
    this.value = 0;
    this.isNegative = false;
  }
  addCharacter(ch) {
    this.hasValue = true;
    if (ch === '-') this.isNegative = true;

    let numValue = characterLookup[ch];
    if (numValue === undefined) throw new Error('Not a digit: ' + ch)

    this.value = this.value * 10 + numValue;
  }
}
 
// debugger;
// console.log(myFastParser(d));
// add tests
suite.add('svg parser', function() {
  counters.parseSVG += parseSVG(d).length;
})
.add('d parser', function() {
  counters.dp += parse(d).length
})
.add('my parser', function() {
  counters.my += myParser(d)
})
.add('my fast parser', function() {
  counters.myFast += myFastParser(d).length;
})
.add('iterator', function() {
  counters.it += iterator(d)
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
  console.log(counters)
})
// run async
.run({ 'async': true });
function myParser(d) {
  if (!d.match(/([ML][-+]?\d+,[-+]?\d+)+/))
  throw new Error('Cannot parse this path data yet: ', d);

return d
  .replace(/[ML]/g, ' ')
  .split(' ')
  .filter((x) => x)
  .map((str) => str.split(',').map((x) => Number.parseFloat(x))).length;
}

function iterator(d) {
  let count = 0;
  for (let i = 0; i < d.length; ++i) {
    let ch = d[i];
    if (ch === '0') count += 1;
  }
  return count;
}



function myFastParser(d) {
  // let buff;
  let numParser = new NumberParser();
  let idx = 0;
  let l = d.length;
  let ch;
  let ctx;
  let lastNumbers;
  let points = [];
  while (idx < l) {
    ch = d[idx];
    if (ch === 'M' || ch === 'L') {
      if (numParser.hasValue) {
        lastNumbers.push(numParser.getValue())
      }
      numParser.reset();
      lastCommand = ch;
      if (lastNumbers) {
        lastNumbers.forEach(num => {points.push(num);});
      }
      lastNumbers = [];
    } else if (ch === ' ' || ch === ',') {
      if (numParser.hasValue) {
        lastNumbers.push(numParser.getValue())
        numParser.reset();
      }
      // ignore.
    } else if (ch === 'Z') {
      // ignore
    } else {
      numParser.addCharacter(ch);
      // buff.push(ch)
    }
    idx += 1;
  }
  if (numParser.hasValue) {
    lastNumbers.push(numParser.getValue());
    lastNumbers.forEach(num => {points.push(num);});
  }
  return points;
}