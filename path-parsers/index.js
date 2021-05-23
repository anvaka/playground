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

const CharacterLookup = {
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

/**
 * Naive parser of integer numbers. Optimized for memory consumption and
 * CPU performance. Not very strong on validation side.
 */
class NumberParser {
  constructor() {
    this.value = 0;
    this.fractionValue = 0;
    this.divider = 1;
    this.exponent = 0;
    this.isNegative = false;
    this.hasValue = false;
    this.hasFraction = false;
    this.hasExponent = false
  }
  getValue() {
    let value = this.value;
    if (this.hasFraction) {
      value += this.fractionValue / this.divider;
    }
    if (this.hasExponent) {
      value *= Math.pow(10, this.exponent);
    }
    if (this.isNegative) {
      return -value;
    }
    return value;
  }
  reset() {
    this.value = 0;
    this.fractionValue = 0;
    this.divider = 1;
    this.exponent = 0;
    this.isNegative = false;
    this.hasValue = false;
    this.hasFraction = false;
    this.hasExponent = false
  }
  addCharacter(ch) {
    this.hasValue = true;
    if (ch === '-') {
      this.isNegative = true;
      return;
    }
    if (ch === '.') {
      if (this.hasFraction) throw new Error('Already has fractional part!');
      this.hasFraction = true;
      return;
    }
    if (ch === 'e') {
      if (this.hasExponent) throw new Error('Already has exponent');
      this.hasExponent = true;
      this.exponent = 0;
      return;
    }

    let numValue = CharacterLookup[ch];
    if (numValue === undefined) throw new Error('Not a digit: ' + ch)

    if (this.hasExponent) {
      this.exponent = this.exponent * 10 + numValue;
    } else if (this.hasFraction) {
      this.fractionValue = this.fractionValue * 10 + numValue;
      this.divider *= 10;
    } else {
      this.value = this.value * 10 + numValue;
    }
  }
}

const processCommand = {
  M(points, lastNumbers) {
    // TODO: validate lastNumbers.length % 2 === 0
    if (points.length === 0) {
      // consider this to be absolute points
      for (let i = 0; i < lastNumbers.length; i += 2) {
        points.push([lastNumbers[i], lastNumbers[i + 1]]);
      }
    } else {
      // Note: this is not true for generic case, and could/should be extended to start a new path.
      // We are just optimizing for own sake of a single path
      throw new Error('Only one "Move" command per path is expected');
    }
  },
  m(points, lastNumbers) {
    let lx = 0, ly = 0;
    if (points.length > 0) {
      let last = points[points.length - 1];
      lx = last[0];
      ly = last[1];
    }
    for (let i = 0; i < lastNumbers.length; i += 2) {
      let x = lx + lastNumbers[i];
      let y = ly + lastNumbers[i + 1];
      points.push([x, y]);
      lx = x; ly = y;
    }
  },
  // line to:
  L(points, lastNumbers) {
    // TODO: validate lastNumbers.length % 2 === 0
    for (let i = 0; i < lastNumbers.length; i += 2) {
      points.push([lastNumbers[i], lastNumbers[i + 1]]);
    }
  },
  // relative line to:
  l(points, lastNumbers) {
    let lx = 0, ly = 0;
    if (points.length > 0) {
      let last = points[points.length - 1];
      lx = last[0];
      ly = last[1];
    }
    for (let i = 0; i < lastNumbers.length; i += 2) {
      let x = lx + lastNumbers[i];
      let y = ly + lastNumbers[i + 1];
      points.push([x, y]);
      lx = x; ly = y;
    }
  },
  H(points, lastNumbers) {
    let y = 0;
    if (points.length > 0) {
      y = points[points.length - 1][1];
    }
    for (let i = 0; i < lastNumbers.length; i += 1) {
      let x = lastNumbers[i];
      points.push([x, y]);
    }
  },
  h(points, lastNumbers) {
    let y = 0, lx = 0;
    if (points.length > 0) {
      lx = points[points.length - 1][0];
      y = points[points.length - 1][1];
    }
    for (let i = 0; i < lastNumbers.length; i += 1) {
      let x = lx + lastNumbers[i];
      points.push([x, y]);
      lx = x;
    }
  },
  V(points, lastNumbers) {
    let x = 0;
    if (points.length > 0) {
      x = points[points.length - 1][0];
    }
    for (let i = 0; i < lastNumbers.length; i += 1) {
      points.push([x, lastNumbers[i]]);
    }
  },
  v(points, lastNumbers) {
    let ly = 0, x = 0;
    if (points.length > 0) {
      x = points[points.length - 1][0];
      ly = points[points.length - 1][1];
    }
    for (let i = 0; i < lastNumbers.length; i += 1) {
      let y = ly + lastNumbers[i];
      points.push([x, y]);
      ly = y;
    }
  }
}

function getPointsFromPathData(d) {
  let numParser = new NumberParser();
  let idx = 0;
  let l = d.length;
  let ch;
  let lastNumbers, lastCommand;
  let points = [];
  while (idx < l) {
    ch = d[idx];
    if (ch in processCommand) {
      if (numParser.hasValue) {
        lastNumbers.push(numParser.getValue())
      }
      numParser.reset();
      if (lastNumbers) lastCommand(points, lastNumbers);
      lastCommand = processCommand[ch];
      lastNumbers = [];
    } else if (ch === ' ' || ch === ',') {
      if (numParser.hasValue) {
        lastNumbers.push(numParser.getValue())
        numParser.reset();
      }
      // ignore.
    } else if (ch === 'Z' || ch === 'z') {
      // ignore
    } else if (numParser.hasValue && ch === '-') {
      // this considered to be a start of the next number.
      lastNumbers.push(numParser.getValue())
      numParser.reset();
      numParser.addCharacter(ch);
    } else {
      numParser.addCharacter(ch);
    }
    idx += 1;
  }
  if (numParser.hasValue) {
    lastNumbers.push(numParser.getValue());
  }
  if (lastNumbers) {
    lastCommand(points, lastNumbers);
  }
  return points;
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
  counters.myFast += getPointsFromPathData(d).length;
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
