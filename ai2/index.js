const JSONStream = require('JSONStream');
const fs = require('fs');
const es = require('event-stream')

let stream = JSONStream.parse();
stream.pipe(
  es.mapSync(data => {
    if (!data.outCitations.length) return;
    let record = {
      id: data.id,
      y: data.year,
      o: data.outCitations,
      e: data.entities
    }

    console.log(JSON.stringify(record))
  })
);


// fs.createReadStream(fileName)
process.stdin.pipe(stream)

