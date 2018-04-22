/**
 * Prints top sound cloud accounts by number of followers
 */
var es = require('event-stream');
var fs = require('fs');
var JSONStream = require('JSONStream');
var outUsersFileName = './data/users.json';
readUsersFile().then(chunk => {
  console.log(chunk);
})

function readUsersFile() {
  var indexedUsers = [];
  console.log('Parsing processed list...');
  return new Promise(resolve => {
    var jsonStreamParser = JSONStream.parse();
    fs.createReadStream(outUsersFileName)
      .pipe(jsonStreamParser)
      .pipe(es.mapSync(markProcessed))
      .on('end', done);

    function markProcessed(user) {
      indexedUsers.push([user.permalink, user.followers_count]);
    }

    function done() {
      console.log('Read ' + indexedUsers.size + ' users');
      console.log('Sorting...')
      indexedUsers.sort((a, b) => b[1] - a[1]);
      resolve(indexedUsers.slice(0, 100));
    }
  })
}