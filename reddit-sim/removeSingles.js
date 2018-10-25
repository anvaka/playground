/**
 * This script filters out users who created just one comment.
 * They do not contribute to "Users who commented here, also comment to" metric.
 */
let forEachLine = require('for-each-line');
var filtered = 0;
var fileName = 'reddit_aug_2018'
var lastUser, lastUserSubs;

forEachLine(fileName, (line) => {
  if (!line) return;

  var parts = line.split(',')
  var user = parts[0];
  var sub = parts[1];
  var count = Number.parseInt(parts[2], 10);
  if (!user || !sub) {
    throw new Error('Something is wrong with this line: ' + line);
  }
  if (!Number.isFinite(count)) {
    console.log(line);
    return;
  } 

  if (lastUser !== user) {
    if (lastUserSubs && lastUserSubs.length > 1) {
      lastUserSubs.forEach(r => console.log(lastUser + ',' + r.sub + ',' + r.count));
    } else if (lastUserSubs) {
      filtered += 1
    }
    lastUser = user;
    lastUserSubs = [];
  }
  lastUserSubs.push({sub, count});
}).then(() => {
  console.warn('Filtered: ', filtered);
});