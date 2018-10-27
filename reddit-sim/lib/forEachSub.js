var fs = require('fs');
var JSONStream = require('JSONStream');
var es = require('event-stream'); 

module.exports = forEachSub;

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