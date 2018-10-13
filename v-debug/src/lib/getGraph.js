import fromJson from 'ngraph.fromjson';
import fromDot from 'ngraph.fromdot';
//var data = require('../data/anvaka_twitter.json')
//import data from '../data/anvaka_2.json';
import data from '../data/anvaka.dot.js';
import createGraph from 'ngraph.graph';
import ngen from 'ngraph.generators';

// module.exports = getGraph; //getDot(require('./data/substack'));
// module.exports = 
// getDot(require('../data/jdalton.dot.js'));

let useSmall = false;

export default function getGraph() {
//  return getDot(require('../data/jdalton.dot.js'))();
  //let graph = useSmall ? smallGraph() : fromJson(data);
  // var graph = createGraph();
  // graph.addLink('a', 't');
  // graph.addLink('a', 's');
  // graph.addLink('a', 'b');
  // graph.addLink('a', 'e');
  // graph.addLink('a', 'd');
  // return graph;
 // return ngen.grid(8, 8)
  //useSmall = true;
  var graph = useSmall ? smallGraph() : fromDot(data);
  return graph;
}

function smallGraph() {
  let graph = createGraph();
  graph.addLink(0, -1);
  graph.addLink(0, 1);
  graph.addLink(1, 2);
  graph.addLink(1, 4);
  graph.addLink(1, 3);
  graph.addLink(4, 6);
  graph.addLink(6, 7);
  graph.addLink(6, 8);
  graph.addLink(6, 9);
  graph.addLink(6, 10);
  graph.addLink(10, 11);
  graph.addLink(10, 12);
  graph.addLink(10, 13);
  return graph;
}

function getDot(txt) {
  return function() {
    return fromDot(txt);
  }
}
