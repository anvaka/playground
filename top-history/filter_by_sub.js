let forEachRecord = require('./lib/forEachRecord');
let createOutStream = require('./createOutStream');

let inputFileName = 'subreddits.json';
let subreddit = 'dataisbeautiful';
let output = createOutStream(`posts_${subreddit}.json`, 'w');
let all = [];

forEachRecord(inputFileName, subredditSnapshot => {
  if (subredditSnapshot.name === subreddit) processSubreddit(subredditSnapshot)
}).then(dump);

function processSubreddit(subredditSnapshot) {
  if (all.length < 50) all.push(subredditSnapshot);
}

function dump() {
  console.log('dumping ', all.length)
  output.write(all);
}