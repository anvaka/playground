const fs = require('fs');
let forEachRecord = require('./lib/forEachRecord');

let inputFileName = process.argv[2] || 'subreddits.json';
let subreddit = process.argv[3] || 'dataisbeautiful';

let maxPostLifeSpan = 24 * 60 * 60 * 1000;
let posts = new Map();
let saveScoresOnly = false;

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
    const nextScore = post.score || 0;
    const nextComments = post.num_comments || 0;

    if (postDataPoints.length === 0 && band > 0) {
      postDataPoints.push({
        date: currentTime,
        band: band,
        score: nextScore,
        position,
        comments: nextComments,
        velocity: 0
      })
      return;
    }

    let prevPoint = postDataPoints[postDataPoints.length - 1] || {
      date: (new Date(currentTime)).setMilliseconds(-fiveMinutes),
      band: -1,
      score: 0,
      comments: 0,
    };

    let bandDiff = (band - prevPoint.band);
    let velocity = (nextScore - prevPoint.score)/bandDiff;
    let dComments = (nextComments - prevPoint.comments)/bandDiff;
    while (bandDiff > 0) {
      let time = new Date(prevPoint.date);
      time.setMilliseconds(fiveMinutes);
      let nextPoint = {
        date: time,
        band: prevPoint.band + 1,
        score: Math.round((prevPoint.score + velocity) * 100)/100,
        position,
        comments: prevPoint.comments + dComments,
        velocity: velocity
      };
      postDataPoints.push(nextPoint);
      prevPoint = nextPoint;
      bandDiff -= 1;
    }

    position += 1;
  }
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
  if (saveScoresOnly) {
    saveScores();
  } else {
    saveCSV();
  }
}

function saveScores() {
  const bands = [];
  const postIdToIndex = {}
  let index = 0;
  console.log('Total posts: ', posts.size);
  posts.forEach((points, postId) => {
    postIdToIndex[postId] = index++;
  });
  let buffer = new Uint32Array(posts.size * 288);
  posts.forEach((points, postId) => {
    let offset = postIdToIndex[postId] * 288;
    let i = 0;
    let bandIndex = 0;
    while (i < 288) {
      const bandDetails = points[bandIndex];
      const bandMatch = bandDetails && bandDetails.band === i;
      let score = bandMatch ? Math.round(bandDetails.score) : -1;
      if (bandMatch) bandIndex += 1;
      buffer[offset + i] = score;
      i++;
    }
  });

  fs.writeFileSync('scores.bin', new Buffer(buffer.buffer));
  // posts.forEach((points, postId) => {
  //   let postIndex = postIdToIndex[postId];
  //   points.map(x => {
  //     let bandPost = bands[x.band];
  //     if (!bandPost) bandPost = bands[x.band] = {};
  //     bandPost[postIndex] = x.score;
  //   });
  // });
  // const scoresFileName = 'scores.json';
  // console.log('saving scores to ' + scoresFileName);
  // fs.writeFileSync(scoresFileName, JSON.stringify(bands));
  const postIndexFileName = 'postIndex.json';
  console.log('saving post index to ' + postIndexFileName);
  fs.writeFileSync(postIndexFileName, JSON.stringify(postIdToIndex));
}

function saveCSV() {
  console.log('post_id,date,band,score,scoreAt24h,velocity,comments,position');
  posts.forEach((points, postId) => printPostPoints(points, postId))
}

function printPostPoints(points, postId) {
  let scoreAt24hMark = getScoreAt24HMark(points);
  if (scoreAt24hMark === undefined) {
    return; // we couldn't collect this, so can't learn from it.
  }
  console.log(
    points.map(x => {
      return [
        postId, x.date.toISOString(), x.band, x.score, scoreAt24hMark, x.velocity, x.comments, x.position
      ].join(',')
    }).join('\n')
  );
}

function getScoreAt24HMark(points) {
  // if (points.length < 288) return;
  // for (let i = 0; i < 288; ++i) {
  //   if (points[i].band !== i) {
  //     debugger;
  //     return;
  //   }
  // }
  // return points[287].score;

  for (let i = points.length - 1; i > 0; i--) {
    let post = points[i];
    if (post.band === 287) return post.score;
    if (post.band < 287) return;
  }
}
