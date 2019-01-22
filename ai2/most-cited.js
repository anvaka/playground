const JSONStream = require('JSONStream');
const fs = require('fs');
const es = require('event-stream')

let stream = JSONStream.parse();
let counts = new Map();
let processed = 0;
stream.pipe(
  es.mapSync(data => {
    data.o.forEach(increaseCount);
    processed += 1;
    if (processed % 100000 === 0) console.warn('processed: ' + processed);
  })
);
stream.on('end', done);


// fs.createReadStream(fileName)
process.stdin.pipe(stream)


function increaseCount(key) {
  counts.set(key, (counts.get(key) || 0) + 1);
}

function done() {
  const res = Array.from(counts).sort((a, b) => b[1] - a[1]).slice(0, 10000);
  console.log(JSON.stringify(res, null, 2));
}
