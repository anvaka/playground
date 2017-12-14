let forEachLine = require('for-each-line');
var fileName = process.argv[2];
if (!fileName) {
  throw new Error('File is required');
}

class User {
  constructor() {
    this.subs = new Map();
    this.total = 0;
  }

  postedTo(sub) {
    this.total += 1;
    this.subs.set(sub, (this.subs.get(sub) || 0) + 1);
  }

  normalize() {
    this.subs.forEach((score, sub) => {
      this.subs.set(sub, score/this.total);
    });
  }
}

var usersWhoPostedToSubreddit = new Map(); // maps subreddit name to user object
var users = new Map();
var normalizedScores = new Map();

forEachLine(fileName, (line) => {
  if (!line) return;

  var parts = line.split(',')
  var user = parts[0];
  var sub = parts[1];
  if (!user || !sub) {
    throw new Error('Something is wrong with this line: ' + line);
  }

  var userObj = users.get(user);

  if (!userObj) {
    userObj = new User();
    users.set(user, userObj);
  }
  userObj.postedTo(sub);
  var subUsers = usersWhoPostedToSubreddit.get(sub);
  if (!subUsers) {
    subUsers = new Set();
    usersWhoPostedToSubreddit.set(sub, subUsers);
  }
  subUsers.add(userObj);
}).then(() => {
  normalize();

  var scores = new Map();
  var srcSub = 'videos';
  forEachUserWhoPostedTo(srcSub, user => {
    var currentSubScore = user.subs.get(srcSub);

    forEachSubredditByUser(user, (subScore, subName) => {
      var score = scores.get(subName) || 0;
      score += subScore * currentSubScore;
      scores.set(subName, score);
    });
  });

  normalizeScores(scores);

  console.log(JSON.stringify(Array.from(scores).sort((x, y) => y[1] - x[1]).slice(0, 100)));
  console.log('Done!')
});

function normalize() {
  users.forEach(user => {
    user.normalize();
  });
}

function normalizeScores(scores) {
  // TODO: This probably needs to be multiplied by src subreddit score
  scores.forEach((score, subName) => {
    scores.set(subName, score/getSubNormalScore(subName));
  });
}

function getSubNormalScore(subName) {
  var normalizedScore = normalizedScores.get(subName);

  if (normalizedScore) return normalizedScore;

  normalizedScore = 0;
  forEachUserWhoPostedTo(subName, user => {
    var currentSubScore = user.subs.get(subName);
    normalizedScore += currentSubScore * currentSubScore;
  });

  normalizedScore = Math.sqrt(normalizedScore);
  normalizedScores.set(subName, normalizedScore);
  return normalizedScore;
}

function forEachUserWhoPostedTo(subName, callback) {
  var users = usersWhoPostedToSubreddit.get(subName);

  if (users) {
    users.forEach(callback);
  }
}

function forEachSubredditByUser(user, callback) {
  var subs = user.subs;
  if (subs) {
    subs.forEach(callback);
  }
}

