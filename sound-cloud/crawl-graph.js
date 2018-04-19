/**
 * Performs bfs indexing of soundcloud users
 */

var argv = require('yargs').argv
var sc = require('./lib/sc');
var es = require('event-stream');
var fs = require('fs');
var forEachLine = require('for-each-line');

var JSONStream = require('JSONStream');
var outUsersFileName = './data/users.json';
var outGraphFileName = './data/graph.json';

var client_id = argv.client || process.env.SOUND_CLOUD_CLIENT_ID;
if (!client_id) {
  throw new Error('Please set SOUND_CLOUD_CLIENT_ID environment variable to start');
}
var client = sc(client_id);

let indexedUsers, queue, usersStream, graphStream;

readIndexedSoFar()
  .then(result => {
    indexedUsers = result.indexedUsers;
    queue = result.queue;
  })
  .then(initOutStreams)
  .then(processQueue);

function processQueue() {
  if (queue.length === 0) {
    console.log('All done. Congrats!');
    return;
  }
  var startFrom = queue.shift();
  console.log('Queue length: ', queue.length);

  client.get('followings', startFrom).then(followers => {
    followers.forEach((follower) => {
      if (!indexedUsers.has(follower.id)) {
        indexedUsers.add(follower.id);
        usersStream.write(follower);
      }
    });

    let followersIds = followers.map(f => f.id).join(',');
    graphStream.write(`${startFrom}->${followersIds}\n`)

    processQueue();
  }).catch(err => {
    console.log('Failed to download: ', startFrom);
    console.log('Error was: ', err);

    processQueue();
  });
}

function readIndexedSoFar() {
  var queue = [];
  var indexedUsers = new Set();
  if (!fs.existsSync(outUsersFileName)) {
    queue.push(315595); // start from Tom Day. I love his music.

    return Promise.resolve({ indexedUsers, queue });
  }

  return readUsersFile()
    .then(readGraphFile)
}

function readUsersFile() {
  var indexedUsers = new Set();
  console.log('Parsing processed list...');
  return new Promise(resolve => {
    var jsonStreamParser = JSONStream.parse();
    fs.createReadStream(outUsersFileName)
      .pipe(jsonStreamParser)
      .pipe(es.mapSync(markProcessed))
      .on('end', done);

    function markProcessed(user) {
      indexedUsers.add(user.id);
    }

    function done() {
      console.log('Read ' + indexedUsers.size + ' users');
      resolve(indexedUsers);
    }
  })
}

function readGraphFile(indexedUsers) {
  let queue = [];

  return forEachLine(outGraphFileName, line => {
    if (line[0] === '#') return; // comment?

    let fromTo = line.split('->')
    if (fromTo.length !== 2) throw new Error('Only one source node expected');
    let from = fromTo[0];

    enqueueIfNeeded(from)

    if (fromTo.length !== 2) return;
    fromTo[1].split(',').forEach(enqueueIfNeeded);
  }).then(() => {
    return {
      indexedUsers, queue
    }
  })

  function enqueueIfNeeded(userId) {
    if (!indexedUsers.has(userId)) {
      queue.push(userId);
    }
  }
}

function initOutStreams() {
  usersStream = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outUsersFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  usersStream.pipe(fileStream);

  graphStream = fs.createWriteStream(outGraphFileName, {
    encoding: 'utf8',
    flags: 'a'
  })
}