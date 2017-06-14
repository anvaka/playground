module.exports = forEachSub;

const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');

function forEachSub(fileName, cb, done) {
  if (!fs.existsSync(fileName)) {
    console.error('No data file: ' + fileName);
    process.exit(-1);
  }

  var jsonStreamParser = JSONStream.parse();
  fs.createReadStream(fileName)
    .pipe(jsonStreamParser)
    .pipe(es.mapSync(cb))
    .on('end', done);
}
