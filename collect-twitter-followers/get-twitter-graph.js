const forEach = require('./lib/forEach.js');

const pagerank = require('ngraph.pagerank');
const graph = require('ngraph.graph')({uniqueLinkId: false});
const inFileName = process.argv[2];
const fs = require('fs');
if (!fs.existsSync(inFileName)) {
  console.log('Pass the followers.json stream here');
  return;
}

forEach(process.argv[2], row => {
  const toId = row.id;
  graph.addNode(toId);
  let followers = row.followers && row.followers.accumulator;
  if (followers) {
    followers.forEach(f => graph.addLink(f, toId));
  }
}).then(() => {
  // console.log('Graph loaded');
  // console.log('Nodes count: ', graph.getNodesCount());
  // console.log('Edges count: ', graph.getLinksCount());

  const rank = pagerank(graph);
  const sortedKeys = Object.keys(rank).sort((x, y) => rank[y] - rank[x]).map(x => {
    return [x, rank[x]];
  }).slice(0, 10);
  //console.log(sortedKeys);
  var toDot = require('ngraph.todot');
  console.log(toDot(graph));
});
