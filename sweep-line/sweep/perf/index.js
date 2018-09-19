require = require("esm")(module/*, options*/)


var g = require('../src/generators');
var findIntersections = require('../src/findIntersections').default;
var lines = g.complete(12, 40);
var randomLines = g.random(100, 42, 1536687392180);

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

suite.add('Circular lines 12x40', function() {
  var res = findIntersections(lines);
  if (res.length !== 313) throw new Error('Invalid number of intersections');
})
.add('100 Random lines lines in 42px box', function() {
  var res = findIntersections(randomLines);
  if (res.length !== 1123) throw new Error('Invalid number of intersections');
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run();