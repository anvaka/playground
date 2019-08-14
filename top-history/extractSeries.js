let forEachRecord = require('./lib/forEachRecord');

let inputFileName = 'subreddits.json';
let subreddit = 'dataisbeautiful';

let utcOffset = (new Date()).getTimezoneOffset()*60000;
let maxPostLifeSpan = 24 * 60 * 60 * 1000;
let posts = new Map();
let series = [];

forEachRecord(inputFileName, subredditSnapshot => {
  if (subredditSnapshot.name === subreddit) processSubreddit(subredditSnapshot)
}).then(saveSeries);

function processSubreddit(subredditSnapshot) {
  let currentTime = new Date(subredditSnapshot.time);
  subredditSnapshot.posts.forEach(post => processPost(post, currentTime));
}

function processPost(post, currentTime) {
  let postCreated = new Date(post.created_utc * 1000 + utcOffset)
  if (currentTime - postCreated > maxPostLifeSpan) return;

  let postDataPoints = getOrCreatePostDataPoints(post.permalink)
  postDataPoints.push({
    date: currentTime,
    score: post.score,
    comments: post.num_comments
  })
}

function getOrCreatePostDataPoints(postId) {
  let points = posts.get(postId);
  if (!points) {
    points = [];
    posts.set(postId, points);
  }

  return points;
}

function saveSeries() {
  console.log('post_id,date,score,comments');
  posts.forEach((points, postId) => printPostPoints(points, postId))
}

function printPostPoints(points, postId) {
  console.log(
    points.map(x => [
        postId, x.date.toISOString(), x.score, x.comments
      ].join(',')
    ).join('\n')
  );
}