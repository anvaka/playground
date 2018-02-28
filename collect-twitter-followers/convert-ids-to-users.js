const yargs = require('yargs')
    .usage('Usage: $0 [options] txt_file_with_one_id_per_line')
    .example('$0 ids.txt', 'Converts ids.txt file into ids.txt.users')
    .help('h')
    .alias('h', 'help');

const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');
const forEach = require('./lib/forEach.js');
const forEachLine = require('./lib/forEachLine.js');
const argv = yargs.argv;

const inputFileName = argv._[0];
if (!fs.existsSync(inputFileName)) {
  yargs.showHelp();
  process.exit(1);
}

const dirname = path.dirname(inputFileName);
const processedFile = path.join(dirname, path.basename(inputFileName) + '.users');

const outStream = createOutStream(processedFile);

const { convertIdsToUser } = require('./lib/twitter-client.js');

readProcessedFile(processedFile)
  .then(readInputFile)
  .then(indexRemaining);

function readProcessedFile(processedFile) {
  let result = {};
  if (!fs.existsSync(processedFile)) {
    return Promise.resolve(result);
  }

  return forEach(processedFile, row =>  {
    result[row.id] = 1;
  }).then(() => result);
}

function readInputFile(alreadyProcessed) {
  let lines = [];
  console.log('reading file ', inputFileName);
  return forEachLine(inputFileName, l => {
    if (!(l in alreadyProcessed)) {
      lines.push(l);
    }
  }).then(() => lines);
}

function indexRemaining(work) {
  console.log('Found ' + work.length + ' users');
  convertIdsToUser(work, user => { outStream.write(user); });
}

return;


function createOutStream(outFileName) {
  const outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);

  return outgoing;
}
