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
  const time = new Date(subredditSnapshot.time);
  subredditSnapshot.posts = subredditSnapshot.posts.filter(post => {
    const within24Hours = Math.abs(time - new Date(post.created_utc * 1000)) < 24*60*60*1000
    return within24Hours && post.score;
  })
  all.push(subredditSnapshot);
}

function dump() {
  console.log('dumping ', all.length)
  output.write(all);
}