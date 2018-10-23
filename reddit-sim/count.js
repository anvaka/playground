let forEachLine = require('for-each-line');
var counts = new Map();
var fileName = 'reddit_aug_2018'
forEachLine(fileName, (line) => {
  var parts = line.split(',')
  var sub = parts[1][0];
  counts.set(sub, (counts.get(sub) || 0) + 1);
}).then(() => {
  console.log(
    Array.from(counts).sort((a, b) => a[1] - b[1])
  );
});