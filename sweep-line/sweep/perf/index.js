require = require("esm")(module/*, options*/)


var g = require('../src/generators');
var findIntersections = require('../src/findIntersections').default;
var lines = g.getCircularLines(12, 40);

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

// console.log(findIntersections)
// var res = findIntersections(lines);
// console.log(res.length);

suite.add('Circular lines 12x40', function() {
  var res = findIntersections(lines);
  if (res.length !== 313) throw new Error('Invalid number of lines');
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  //console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run();