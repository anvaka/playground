/**
 * Counts number of unique commenters per redit
 */
var forEachLine = require('for-each-line');
var fileName = process.argv[2] || 'github_watch.reddit_comments_2018_08.csv'

var counts = new Map();

forEachLine(fileName, (line) => {
  var parts = line.split(',')
  var sub = parts[1];
  counts.set(sub, (counts.get(sub) || 0) + 1);
}).then(() => {
  console.log(
    Array.from(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(x => x[1] > 1)
      .join('\n')
  );
});
