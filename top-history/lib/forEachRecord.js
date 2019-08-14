const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');

module.exports = function forEachRecord(fileName, handler) {
  return new Promise((resolve, reject) => {
      if (!fs.existsSync(fileName)) {
        reject('No data file: ' + fileName);
        return;
      }

      var jsonStreamParser = JSONStream.parse();
      fs.createReadStream(fileName)
        .pipe(jsonStreamParser)
        .pipe(es.mapSync(handler))
        .on('end', resolve);
  })
}