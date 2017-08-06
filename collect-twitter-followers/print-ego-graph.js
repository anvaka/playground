/**
 * Returns list of followers for the first level and connections between them
 * Unlike get-twitter-graph this script does not include friends of friends level.
 */
const getEgoGraph = require('./lib/getEgoGraph.js');

const inFileName = process.argv[2];
const screenNames = process.argv[3]
const fs = require('fs');
const forEach = require('./lib/forEach.js');

if (!fs.existsSync(inFileName)) {
  console.log('Pass the followers.json stream here');
  console.log(' > node print-ego-graph.js data/anvaka/followers.json data/anvaka/ids.txt.users');
  process.exit(1);
  return;
}

if (!fs.existsSync(screenNames)) {
  console.log('Construct user ids first: ');
  console.log(' > node print-ego-graph-ids.js data/anvaka/followers.json > data/anvaka/ids.js');
  console.log(' > node conver-ids-to-users.js data/anvaka/ids.txt');
  console.log(' > node print-ego-graph.js data/anvaka/followers.json data/anvaka/ids.txt.users');
  process.exit(2);
}

let users = {};

forEach(screenNames, row =>  {
  users[row.id] = row;
}).then(() => {
  const graph = require('ngraph.graph')({uniqueLinkId: false});

  getEgoGraph(inFileName).then(idGraph => {
    idGraph.forEachNode(node => {
      let name = screenName(node.id)
      if (name) graph.addNode(name);
    });

    idGraph.forEachLink(link => {
      let from = screenName(link.fromId);
      let to = screenName(link.toId);
      if (from && to) {
        graph.addLink(from, to);
      }
    });

    var toDot = require('ngraph.todot');
    console.log(toDot(graph));
  });

  function screenName(id) {
    return users[id] && users[id].screen_name;
  }
});

