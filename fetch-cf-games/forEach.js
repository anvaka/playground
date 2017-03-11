var fs = require('fs');
var es = require('event-stream');
var JSONStream = require('JSONStream');

module.exports = forEachProcessed;

function forEachProcessed(fileName, visitItemCallback) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fileName)) {
      resolve(processed);
      return;
    }

    var jsonStreamParser = JSONStream.parse();
    fs.createReadStream(fileName)
        .pipe(jsonStreamParser)
        .pipe(es.mapSync(visitItemCallback))
        .on('end', () => resolve());
  });
}
