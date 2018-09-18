require = require("esm")(module/*, options*/)

var findIntersections = require('../src/findIntersections').default;
var test = require('tap').test;

test('it can find vertical/horizontal intersections', (t) => {
  var cross = findIntersections([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 0, y: -1},
    to: {x: 0, y: 1},
  }]);

  t.equals(cross.length, 1, 'one intersection found');
  t.equals(cross[0].point.x, 0)
  t.equals(cross[0].point.y, 0)
  t.end();
})

test('it can find adjacent points', (t) => {
  var cross = findIntersections([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 1, y: 0},
    to: {x: 2, y: 2},
  }]);

  t.equals(cross.length, 1, 'one intersection found');
  t.equals(cross[0].point.x, 1)
  t.equals(cross[0].point.y, 0)
  t.end();
})

test('it can find all segments', t => {
  var cross = findIntersections([{
    from: {x: 0, y: 0},
    to: {x: 1, y: 1},
  }, {
    from: {x: 1, y: 0},
    to: {x: 0, y: 1},
  }, {
    from: {x: 0.5, y: 0},
    to: {x: 0.5, y: 1},
  }]);

  t.equals(cross.length, 1, 'one intersection found');
  t.equals(cross[0].point.x, 0.5)
  t.equals(cross[0].point.y, 0.5)
  t.equals(cross[0].segments.length, 3, 'all three segments found')
  t.end();
})