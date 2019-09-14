let forEachRecord = require('./lib/forEachRecord');

let inputFileName = process.argv[2] || 'subreddits.json';
let subreddit = process.argv[3] || 'dataisbeautiful';

let maxPostLifeSpan = 24 * 60 * 60 * 1000;
let posts = new Map();

forEachRecord(inputFileName, subredditSnapshot => {
  if (subredditSnapshot.name === subreddit) processSubreddit(subredditSnapshot)
}).then(saveSeries);

function processSubreddit(subredditSnapshot) {
  let currentTime = new Date(subredditSnapshot.time);
  currentTime.setSeconds(0);
  let position = 1;
  subredditSnapshot.posts.forEach((post) => processPost(post, currentTime));

  function processPost(post, currentTime) {
    let postCreated = new Date(post.created_utc * 1000)
    let elapsed = currentTime - postCreated;
    if (elapsed > maxPostLifeSpan) return;
    let fiveMinutes = 5 * 60 * 1000;

    let postDataPoints = getOrCreatePostDataPoints(post.permalink)
    let band = Math.round(elapsed/fiveMinutes);
    let prevPoint = postDataPoints[postDataPoints.length - 1];
    const score = post.score || 0;
    let velocity = getVelocity(prevPoint, band, score);

    postDataPoints.push({
      date: currentTime,
      band,
      score,
      velocity,
      position,
      comments: post.num_comments || 0
    });

    position += 1;
  }
}

function getVelocity(prevPoint, currentBand, currentScore) {
  if (!prevPoint) return 0;
  let bandChange = currentBand - prevPoint.band;
  return (currentScore - prevPoint.score) / bandChange;
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
  console.log('post_id,date,band,score,score_final,velocity,comments,position');
  posts.forEach((points, postId) => printPostPoints(points, postId))
}

function printPostPoints(points, postId) {
  let scoreAt24hMark = getScoreAt24HMark(points);
  if (scoreAt24hMark === undefined) {
    return; // we couldn't collect this, so can't learn from it.
  }
  return;
  console.log(
    points.map(x => {
      return [
        postId, x.date.toISOString(), x.band, x.score, scoreAt24hMark, x.velocity, x.comments, x.position
      ].join(',')
    }).join('\n')
  );
}

function getScoreAt24HMark(points) {
  for (let i = points.length - 1; i > 0; i--) {
    let post = points[i];
    if (post.band === 287) return post.score;
    if (post.band < 287) return;
  }
}