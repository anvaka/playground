const yargs = require('yargs')
    .usage('Usage: $0 [options] screen_name')
    .example('$0 anvaka', 'Collect followers ids for anvaka')
    .option('out', {
        alias: 'o',
        describe: 'output folder with results',
        default: './data'
      })
    .option('queue', {
      alias: 'q',
      describe: 'a JSON file with follower ids to collect'
    })
    .help('h')
    .alias('h', 'help');

const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');
const forEach = require('./lib/forEach.js');

const { getAllFollowersByScreenName, getAllFollowersByUserId } = require('./lib/twitter-client.js');

const argv = yargs.argv;
const queueFile = path.join(argv.out, 'queue.json');
const processedFile = path.join(argv.out, 'followers.json');
const outStream = createOutStream(processedFile);

if (fs.existsSync(queueFile)) {
  console.log('Reading queue file from ' + queueFile);
  let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  processQueue(queue);
} else if (argv._.length) {
  const screen_name = argv._[0];
  console.log('Queue file is missing. Creating a new queue file for ' + screen_name);
  getAllFollowersByScreenName(screen_name).then(result => {
    const follower_ids = result.accumulator;
    console.log('Done. Saving into ' + queueFile);
    fs.writeFileSync(queueFile, JSON.stringify(follower_ids));
    processQueue(follower_ids);
  });
} else {
  yargs.showHelp();
  process.exit(1);
}

return;


function processQueue(queue) {
  console.log('Processing queue with ' + queue.length + ' records');
  console.log('Reading processed followers');
  readProcessedFile(processedFile)
    .then(seen => {
      processNext(queue, 0, seen);
    });

  function processNext(queue, idx, seen) {
    if (idx >= queue.length) {
      console.log('All done');
      return;
    }
    console.log('Processing ' + idx + '/' + queue.length + ';');

    const user_id = queue[idx];
    if (seen.has(user_id)) {
      setTimeout(() => processNext(queue, idx + 1, seen), 0);
    } else {
      getAllFollowersByUserId(user_id).then(followers => {
        seen.add(user_id);
        outStream.write({
          id: user_id,
          followers
        })
        processNext(queue, idx + 1, seen);
      });
    }
  }
}

function createOutStream(outFileName) {
  const outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);

  return outgoing;
}

function readProcessedFile(fileName) {
  const seen = new Set();
  let processedRowsCount = 0;
  console.log('Parsing processed list...');

  return forEach(fileName, row => {
    processedRowsCount += 1;
    seen.add(row.id);
  }).then(reportDone);

  function reportDone() {
    console.log('Processed: ' + processedRowsCount);
    return seen;
  }
}
