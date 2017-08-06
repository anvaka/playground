/**
 * Returns list of followers for the first level and connections between them.
 * Unlike get-twitter-graph this script does not include friends of friends level.
 * 
 * Prints only ids. If you need a graph - use  print-ego-graph
 */
const getEgoGraph = require('./lib/getEgoGraph.js');

const inFileName = process.argv[2];
const fs = require('fs');

if (!fs.existsSync(inFileName)) {
  console.log('Pass the followers.json stream here');
  return;
}

getEgoGraph(inFileName).then(graph => {
  graph.forEachNode(node => {
    console.log(node.id);
  });
});
