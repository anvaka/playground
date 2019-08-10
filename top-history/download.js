const fetch = require('node-fetch');
let outFileName = 'subreddits.json';
let fs = require('fs');
let JSONStream = require('JSONStream');
let es = require('event-stream');
let output = createOutStream();
let subreddits = ['dataisbeautiful', 'math', 'programming', 'javascript']
let last = 0;
processNext()

function processNext() {
  if (last >= subreddits.length) {
    return;
  }
  const name = subreddits[last];
  last += 1;

  console.log(+new Date() + ' fetching ' + name)
  fetch(`https://www.reddit.com/r/${name}.json?limit=100`)
    .then(x => x.json())
    .then(x => {
      x.query = {
        name,
        time: (new Date()).toUTCString()
      }
      output.write(x)
    })
    .then(_ => wait(3000))
    .then(processNext)
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function createOutStream() {
  let outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);
  return outgoing;
}