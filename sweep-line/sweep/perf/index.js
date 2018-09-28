var alternativeImplementation = require('bentley-ottman-sweepline');

var g = require('./generators');
var findIntersections = require('../');

var lines = g.complete(12, 40);
var randomLines = g.random(100, 42, 1536687392180);

var aLines = lines.map(x => [[x.from.x, x.from.y], [x.to.x, x.to.y]]);
var aRandomLines = randomLines.map(x => [[x.from.x, x.from.y], [x.to.x, x.to.y]]);

  // var res = alternativeImplementation(aRandomLines);
  // console.log(res.length);
  // return;
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

suite.add('Circular lines 12x40', function() {
  var res = findIntersections(lines).run();
  if (res.length !== 313) throw new Error('Invalid number of intersections');
})
.add('100 Random lines lines in 42px box', function() {
  var res = findIntersections(randomLines).run();
  if (res.length !== 1123) throw new Error('Invalid number of intersections');
// }).add('Alternative circular lines 12x40', function () {
//   var res = alternativeImplementation(aRandomLines);
//   if (res.length !== 1123) throw new Error('Invalid number of intersections');
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run();
