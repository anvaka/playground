require = require("esm")(module/*, options*/)

var findIntersections = require('../src/findIntersections').default;
var test = require('tap').test;
var rnd = require('../src/generators').random;

test('it can find vertical/horizontal intersections', (t) => {
  var intersections = findIntersections([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 0, y: -1},
    to: {x: 0, y: 1},
  }]);

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 0)
  t.equals(intersections[0].point.y, 0)
  t.end();
})

test('it can find adjacent points', (t) => {
  var intersections = findIntersections([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 1, y: 0},
    to: {x: 2, y: 2},
  }]);

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 1)
  t.equals(intersections[0].point.y, 0)
  t.end();
})

test('it can find all segments', t => {
  var intersections = findIntersections([{
    from: {x: 0, y: 0},
    to: {x: 1, y: 1},
  }, {
    from: {x: 1, y: 0},
    to: {x: 0, y: 1},
  }, {
    from: {x: 0.5, y: 0},
    to: {x: 0.5, y: 1},
  }]);

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 0.5)
  t.equals(intersections[0].point.y, 0.5)
  t.equals(intersections[0].segments.length, 3, 'all three segments found')
  t.end();
})

test('it can find intersections in cube', t => {
  var intersections = findIntersections([{
    from: {x: -1, y: -1},
    to: {x: -1, y: 1},
  }, {
    from: {x: -1, y: 1},
    to: {x: 1, y: 1},
  }, {
    from: {x: 1, y: 1},
    to: {x: 1, y: -1},
  }, {
    from: {x: 1, y: -1},
    to: {x: -1, y: -1},
  }]);
  t.equals(intersections.length, 4, 'four intersections found');
  t.end();
});

test('it does not ignore endpoint if it is internal', t => {
  var intersections = findIntersections([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 1, y: 1},
    to: {x: 1, y: -1},
  }], {
    ignoreEndpoints: true
  });
  t.equals(intersections.length, 1, 'four intersections found');
  t.end();
});

test('It rounds very close horizontal lines', t => {
  // y coordinate here is almost the same. This is a tricky case for
  // floating point operations, so we round `y` coordinate to avoid
  // precision errors:
  var lines = [
      {
        "from": {
          "x": 0.43428174033761024,
          "y": -0.3734140731394291
        },
        "to": {
          "x": -0.36442824453115463,
          "y": -0.3734140805900097
        },
      },
      {
        "from": {
          "x": -0.1504860669374466,
          "y": -0.07342482730746269
        },
        "to": {
          "x": 0.28500136360526085,
          "y": -0.3957986496388912
        },
      }
    ];
  var intersection = findIntersections(lines);
  t.equals(intersection.length, 1, 'intersection found');
  t.end();
})

// test('find throw', t => {
//   var seed = 0;
//   while (true) {
//     try {
//       var lines = rnd(5, 1, seed)
//       findIntersections(lines)
//       seed += 1;
//       if (seed % 50000 === 0) console.log(seed);
//     } catch(e) {
//       console.log(seed);
//       break;
//     }
//   }
//   t.end();
// });