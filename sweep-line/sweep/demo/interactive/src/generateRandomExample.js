var createRandom = require('ngraph.random');
var prng = createRandom(42);

var params = [
  {
    name: 'random',
    args: [
      {min: 100, max: 500},  // number of lines
      {min: 100, max: 200},  // visible area
    ]
  },
  {
    name: 'complete',
    args: [
      {min: 10, max: 40},  // number of nodes
      function p1(qs) {
        return Math.round((10 + prng.gaussian()) * qs.p0);
        // {min: 400, max: 600},  // visible area
      }
    ]
  },
  {
    name: 'cube',
    args: [
      {min: 100, max: 150},  // number of rects
      function p2() {
        return Math.round((10 + prng.gaussian()));
      }
    ]
  },
  {
    name: 'drunkgrid',
    args: [
      {min: 10, max: 150},  // Row x Col
      function p2(qs) {
        var v = Math.round(Math.random() * 10) + 1;
        if (qs.p0 > 20 && v < 1) v = 3;
        return v;
      }
    ]
  },
  {
    name: 'triangle',
    args: [
      {min: 10, max: 30},  // Count  
      function p2(qs) {
        return Math.round(Math.sqrt(qs.p0));
      }
    ]
  }
]

export default function generateRandomExample() {
  var generatorIdx = Math.round(Math.random() * (params.length - 1));
  var generator = params[generatorIdx];

  var qs = {
    generator: generator.name
  }
  generator.args.forEach((range, idx) => {
    var keyName = `p${idx}`;
    if (typeof range === 'function') {
      qs[keyName] = range(qs);
    } else  {
      qs[keyName] = Math.round(Math.random() * (range.max - range.min) + range.min);
    }
  });

  return qs;
}