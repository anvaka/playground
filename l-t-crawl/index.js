let tokens = require('/Users/anvaka/twitter/keys.js');

const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');
const dataFolder = 'data';
const queueFile = path.join(dataFolder, 'queue.json');
const processedFile = path.join(dataFolder, 'followers.json');
const createEventStack = require('./lib/eventStack.js');
const forEach = require('./lib/forEach.js');
const downloadFollowers = require('./lib/downloadFollowers.js');

const outStream = createOutStream(processedFile);
const max_users_per_call = 10;

// maps userId to current crawling status
let pendingUsers = new Map();
let lastProcessedIndex = 0;

if (fs.existsSync(queueFile)) {
  console.log('Reading queue file from ' + queueFile);
  let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8')) || [];
  console.log('Queue loaded. Queue length: ', queue.length);
  processQueue(queue);
} else {
  console.log('Please create a queue file first');
  process.exit(1);
}

function processQueue(queue) {
  readProcessedFile(processedFile).then(start);

  function readProcessedFile(fileName) {
    const seen = new Set();
    let processedRowsCount = 0;
    console.log('Parsing processed list...');

    return forEach(fileName, row => {
      processedRowsCount += 1;
      seen.add(row.id);
    }).then(filterQueue);

    function filterQueue() {
      console.log('Processed ' + processedRowsCount);
      return queue.filter(item => !seen.has(item));
    }
  }
}

function start(queue) {
  console.log('Starting the queue processing. Ids remaining: ', queue.length);
  let eventStack = createEventStack(onTokenReady);

  tokens.forEach((auth, idx) => {
    eventStack.push({ auth, id: idx });
  });

  function onTokenReady(worker) {
    let requests = getUsersToDownload();
    downloadFollowers(requests, worker.auth).then(processResponse);

    function processResponse(res) {
      console.log(worker.id, 'Processing worker response with ' + res.users.length + ' users');
      res.users.forEach(processUser);
      let waitTime = res.wait || 0;
      let now = new Date();
      let resumeAt = new Date(waitTime + (+new Date()))
      console.log(worker.id, now, 'Worker waits for ' + waitTime + 'ms. Until ' + resumeAt);
      eventStack.push(worker, waitTime);
    }
  }

  function getUsersToDownload() {
    // prioritize semi-complete users first:
    let candidates = Array.from(pendingUsers).filter(pair => {
      return !pair[1].downloading;
    }).map(pair => {
      // mark this pair as being downloaded now, so that nobody else
      // downloads it.
      pair[1].downloading = true;

      return {
        id:  pair[1].id,
        cursor: pair[1].cursor
      }
    }).slice(0, max_users_per_call);

    while (candidates.length < max_users_per_call && lastProcessedIndex < queue.length) {
      candidates.push(queue[lastProcessedIndex]);
      lastProcessedIndex += 1;
    }

    return candidates;
  }
}

function processUser(user) {
  if (user.cursor || user.wait) {
    // this means we haven't finished crawling this user
    markSemiComplete(user);
  } else {
    // Finished processing this one
    markComplete(user);
  }
}

function markSemiComplete(user) {
  let prevResult = pendingUsers.get(user.id);
  if (!user.followers) user.followers = [];
  if (prevResult) {
    console.log('got more results for ' + user.id);
    prevResult.followers = prevResult.followers.concat(user.followers || [])
    if (user.cursor) prevResult.cursor = user.cursor;
  } else {
    console.log('marking ' + user.id + ' for pending');
    pendingUsers.set(user.id, user);
  }
}

function markComplete(user) {
  let prevResult = pendingUsers.get(user.id);
  if (prevResult) {
    console.log('got more results for ' + user.id);
    prevResult.followers = prevResult.followers.concat(user.followers)
    delete prevResult.wait;
    delete prevResult.cursor;
    delete prevResult.downloading;
    pendingUsers.delete(user.id);
  } else {
    prevResult = user;
  }

  outStream.write(prevResult);
}

function createOutStream(outFileName) {
  const outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);

  return outgoing;
}

