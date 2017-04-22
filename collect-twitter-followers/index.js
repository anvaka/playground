var fs = require('fs');
var getTwitterFollowers = require('get-twitter-followers');

var maxAllowedFollowers = 50000;
var maxUsersToIndex = 1000;
var outPrefix = 'data/';

const tokens = {
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_key:    process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

var queue = ['anvaka'];
var processed = new Set();

processNext(0);

function processNext(lastIndex) {
  if (queue.length === 0) return 'all done';
  if (lastIndex >= maxUsersToIndex) {
    console.log('Indexed ' + maxUsersToIndex + '. Stopping now.');
    fs.writeFileSync(outPrefix + queue[0] + '_queue.json', JSON.stringify(queue));
    return;
  }

  var user = queue.pop();
  console.log('Indexing ' + user + '; Users in queue: ' + queue.length);
  processed.add(user);

  indexUser(user).then(followers => {
    followers.forEach(f => {
      var otherUser = f.screen_name;
      if (!processed.has(otherUser)) {
        processed.add(otherUser);
        if (f.followers_count < maxAllowedFollowers) {
          // we don't want to be stuck in indexing celerbrities.
          queue.push(otherUser);
        } else {
          console.log('Ignoring ' + otherUser + '. Too many followers: ' + f.followers_count);
        }
      }
    });

    console.log('finished indexing ' + user + '; queue size: ' + queue.length);
    processNext(lastIndex + 1);
  });
}

function indexUser(userName) {
  var outFileKey = 'data/' + userName + '.json';
  if (fs.existsSync(outFileKey)) {
    console.log('already indexed ' + userName);
    return new Promise((resolve, reject) => {
      fs.readFile(outFileKey, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(JSON.parse(data));
      });
    });
  }

  return getTwitterFollowers(tokens, userName).then(followers => {
    fs.writeFileSync(outFileKey, JSON.stringify(followers));
    return followers;
  });
}
