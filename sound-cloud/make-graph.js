/**
 * Downloads graph for a given user id
 */

var argv = require('yargs').argv
var sc = require('./lib/sc');
var createGraph = require('ngraph.graph');
var toDot = require('ngraph.todot');
var toJson = require('ngraph.tojson');
var fs = require('fs');

var client_id = argv.client || process.env.SOUND_CLOUD_CLIENT_ID;
if (!client_id) {
  throw new Error('Please set SOUND_CLOUD_CLIENT_ID environment variable to start');
}

// Starting user id, can be found via soundcloud://users:
// search on a page source.
var startFrom = argv.user || 315595;  // 315595 - Tom Day, I love his work!

// followings - list of users who are followed by the users
var kind = argv.kind || 'followings'

// How many level deep should we go?
var depth = argv.depth || 1;

console.log(`Collecting ${kind} graph for ${startFrom}, graph depth is ${depth}`);
var outDotFileName = '' + startFrom + '.dot';
var outJsonFileName = '' + startFrom + '.json';

var client = sc(client_id);
var graph = createGraph();

var queue = [];
var enqueued = new Set();

enqueue(startFrom);

graph.addNode(startFrom, {
  depth: 0
});


processQueue();

function enqueue(userId) {
  if (enqueued.has(userId)) return;

  enqueued.add(userId);
  queue.push(userId);
}

function saveGraph() {
  console.log('Done fetching graph.')
  console.log(`Graph size: ${graph.getNodesCount()} nodes, ${graph.getLinksCount()} edges.`);
  console.log('')
  console.log('Saving dot file to ', outDotFileName);
  fs.writeFileSync(outDotFileName, toDot(graph), 'utf8');
  console.log('Saving json file to ', outDotFileName);
  fs.writeFileSync(outJsonFileName,  toJson(graph), 'utf8');

  console.log('All done')
}

function processQueue() {
  if (queue.length === 0) {
    saveGraph();
    return;
  }
  var startFrom = queue.shift();
  var fromNode = graph.getNode(startFrom);
  if (!fromNode) {
    throw new Error('Missing node: ', fromNode);
  }
  console.log('Queue length: ', queue.length);

  client.get(kind, startFrom).then(followers => {
    followers.forEach((follower) => {
      if (!graph.hasNode(follower.id)) {
        graph.addNode(follower.id, {
          depth: fromNode.depth + 1,
          response: follower
        });

        if (fromNode.data.depth < depth) {
          enqueue(follower.id);
        }
      }

      graph.addLink(fromNode.id, follower.id);
    });

    processQueue();
  }).catch(err => {
    console.log('Failed to download: ', startFrom);
    console.log('Error was: ', err);

    processQueue();
  });
}