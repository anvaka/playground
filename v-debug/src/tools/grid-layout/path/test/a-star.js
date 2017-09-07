let test = require('tap').test;
let aStar = require('../a-star');
let fromDot = require('ngraph.fromdot');
// let createGraph = require('ngraph.graph');

test('it can find paths', (t) => {
  let graph = fromDot(`digraph G {
    a -> b
    b -> c
    b -> d
    c -> d
  }`);
  
  graph.getNode('a').data = { x: 0, y: 0 };
  graph.getNode('b').data = { x: 2, y: 0 };  graph.getNode('c').data = { x: 1, y: 1 }
  graph.getNode('d').data = { x: 2, y: 2 }

  let pathFind = aStar(graph, {
    heuristic(fromId, toId) {
      let fromPos = graph.getNode(fromId).data;
      let toPos = graph.getNode(toId).data;

      return aStar.l2(fromPos, toPos);
    },
    distance(fromId, toId) {
      let fromPos = graph.getNode(fromId).data;
      let toPos = graph.getNode(toId).data;

      return aStar.l2(fromPos, toPos);
    }
  });

  let path = pathFind.find('a', 'd')
  t.equals(path.length, 3, 'Three nodes in path')
  t.equals(path[0], 'd', 'd is here')
  t.equals(path[1], 'b', 'b is here')
  t.equals(path[2], 'a', 'a is here')

  t.end();
});