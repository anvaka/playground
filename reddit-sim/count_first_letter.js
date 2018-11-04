/**
 * Counts all first letters in sbureddit names in a file
 */
var forEachLine = require('for-each-line');
var fileName = process.argv[2] || 'github_watch.reddit_comments_2018_08.csv'

var counts = new Map();
var fileName = ''

forEachLine(fileName, (line) => {
  var parts = line.split(',')
  var sub = parts[1][0];
  counts.set(sub, (counts.get(sub) || 0) + 1);
}).then(() => {
  console.log(
    Array.from(counts).sort((a, b) => a[1] - b[1])
  );
});
