var test = require('tap').test;

var isect = require('../');
// var rnd = require('../demo/interactive/src/generators.js').random;

test('it can find vertical/horizontal intersections', (t) => {
  var intersections = isect([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 0, y: -1},
    to: {x: 0, y: 1},
  }]).run();

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 0)
  t.equals(intersections[0].point.y, 0)
  t.end();
})

test('it can find adjacent points', (t) => {
  var intersections = isect([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 1, y: 0},
    to: {x: 2, y: 2},
  }]).run();

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 1)
  t.equals(intersections[0].point.y, 0)
  t.end();
});

test('it can find all segments', t => {
  var intersections = isect([{
    from: {x: 0, y: 0},
    to: {x: 1, y: 1},
  }, {
    from: {x: 1, y: 0},
    to: {x: 0, y: 1},
  }, {
    from: {x: 0.5, y: 0},
    to: {x: 0.5, y: 1},
  }]).run();

  t.equals(intersections.length, 1, 'one intersection found');
  t.equals(intersections[0].point.x, 0.5)
  t.equals(intersections[0].point.y, 0.5)
  t.equals(intersections[0].segments.length, 3, 'all three segments found')
  t.end();
})

test('it can find intersections in cube', t => {
  var intersections = isect([{
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
  }]).run();
  t.equals(intersections.length, 4, 'four intersections found');
  t.end();
});

test('it does not ignore endpoint if it is internal', t => {
  var intersections = isect([{
    from: {x: -1, y: 0},
    to: {x: 1, y: 0},
  }, {
    from: {x: 1, y: 1},
    to: {x: 1, y: -1},
  }], {
    ignoreEndpoints: true
  }).run();
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
  var intersection = isect(lines).run();
  t.equals(intersection.length, 1, 'intersection found');
  t.end();
});

test('it finds intersection when one segment ends on another', t => {
  var lines = [
    {
      "from": {
        "x": 0.8020039759576321,
        "y": 1.0324788875877857
      },
      "to": {
        "x": 0.449962355196476,
        "y": -0.28189642354846
      },
    },
    {
      "from": {
        "x": -1.300572719424963,
        "y": 1.1440130062401295
      },
      "to": {
        "x": -0.40869949758052826,
        "y": -0.6947379671037197
      },
    },
    {
      "from": {
        "x": 1.425792083144188,
        "y": 1.1113514006137848
      },
      "to": {
        "x": -1.1965897008776665,
        "y": -0.5762606598436832
      },
    },
    {
      "from": {
        "x": 0.6898417733609676,
        "y": 1.4930395111441612
      },
      "to": {
        "x": -0.5260335020720959,
        "y": -0.49431975558400154
      },
    },
    {
      "from": {
        "x": 1.1742585226893425,
        "y": 0.6070638746023178
      },
      "to": {
        "x": 0.3658513203263283,
        "y": -0.38512956351041794
      },
    }
  ]
  var intersection = isect(lines).run();
  t.equals(intersection.length, 5, 'intersection found');
  t.end();
})

// test('find throw', t => {
//   var seed = 0; // 2599483
//   while (true) {
//     try {
//       var lines = rnd(15, 1, seed)
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
