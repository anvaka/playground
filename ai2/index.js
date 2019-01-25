/**
 * Convert *.gz files into single file. Filtering papers with citations only
 * 
 * zcat *.gz | node index.js > all.txt
 */
const JSONStream = require('JSONStream');
const es = require('event-stream')

let stream = JSONStream.parse();
stream.pipe(
  es.mapSync(data => {
    if (!data.outCitations.length) return;
    let record = {
      id: data.id,
      t: data.title,
      y: data.year,
      o: data.outCitations,
      e: data.entities
    }

    console.log(JSON.stringify(record))
  })
);

process.stdin.pipe(stream)