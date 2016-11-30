const readline = require('readline');
const fs = require('fs');

var fileName = process.argv[2] || 'martin_eden.txt';
const rl = readline.createInterface({
  input: fs.createReadStream(fileName)
});

var ignoreWords = new Set(require('./stowords.js'))

var counts = new Map();
var maxValue = 0;
var maxFontSize = 150;
rl.on('line', (line) => {
  line.split(/\s/).forEach(p => {
    p = p.toLowerCase().replace(/[-?,!."':;]/g, '');

    if (ignoreWords.has(p) || !p) return;
    var newCount = (counts.get(p) || 0) + 1;
    counts.set(p, newCount)
    if (newCount > maxValue) maxValue = newCount;
  });
}).on('close', () => {
  var words = Array.from(counts).sort((x, y) => y[1] - x[1])
  .map(x => {
    return [x[0], Math.round(maxFontSize * x[1]/maxValue) + 3]
  }).slice(0, 1500)
  console.log(JSON.stringify(words));
});
