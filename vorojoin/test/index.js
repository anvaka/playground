let test = require('tap').test;
let vorojoin = require('../');
let createRandom = require('ngraph.random');
// let pos = require('./positions.json');

test('it can get svg', t => {
  let arr = [];
  let random = createRandom(42);
  let count = 3;
  for (let i = 0; i < count; ++i) {
    arr.push(
      [
        100 * Math.cos(2 * Math.PI * i / count),
        100 * Math.sin(2 * Math.PI * i / count)
      ]
      // [(random.nextDouble() - 0.5) * 100, (random.nextDouble() - 0.5) * 100]
    )
  }
  let joiner = vorojoin([[-100, -100], [0, 100], [-40, 40], [100, -100]])
  // let indexToCluster = []
  // pos.forEach(x => {
  //   arr.push(x.pos);
  //   indexToCluster.push(x.cluster)
  // });
  // let joiner = vorojoin(arr, {
  //   getClusterId(index) {
  //     return indexToCluster[index];
  //   }
  // });
  console.log(joiner.getSVG());
  t.end();
})

/*
test('vptree', t => {
  const VPTree = require('mnemonist/vp-tree');
let tree = new VPTree(euclid, [[-100, -100], [100, 100]]);

debugger;
  tree.nearestNeighbors(2, [100, 100]).length === 2
// since we have two points in the tree, we expect the first one
// to be the query point itself, and the second one is [-100, -100]
console.log(
);
t.end();
// Instead we get just one point [100, 100]...

function  euclid(a, b) {
  var dx = b[0] - a[0], dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy)
}

})
*/