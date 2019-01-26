let forEachLine = require('for-each-line');
let counter = new Map();
let fileName = process.argv[2] || './cpp/sorted.txt';

forEachLine(fileName, (line) => {
  const [id, count] = line.split(',');
  counter.set(count, (counter.get(count) || 0) + 1);
}).then(() => {
  console.log(
    Array.from(counter).sort((a, b) => a[0] - b[0]).map(p => p.join('\t')).join('\n')
  )
});
