const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');

module.exports = forEach;

function forEach(fileName, visitor) {
  if (!fs.existsSync(fileName)) {
    throw new Error('File ' + fileName + ' is not found');
  }

  return new Promise(resolve => {
    fs.createReadStream(fileName)
      .pipe(JSONStream.parse())
      .pipe(es.mapSync(visitor))
      .on('end', resolve);
  });
}
