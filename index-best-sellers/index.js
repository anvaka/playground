var getPage = require('./lib/getPage');
var parseBestSellerPage = require('./lib/parseBestSellerPage');
var processedFileName = 'data/books.json';

var es = require('event-stream');
var fs = require('fs');
var JSONStream = require('JSONStream');

var defaultStartFrom = 'https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/';
var queue = [];
var outgoing;

var indexedSoFar = new Map();
var enqueued = new Set();

readIndexedSoFar().then(crawlInfo => {
  queue = crawlInfo.queue;
  outgoing = createOutStream();

  console.log('queue length', queue.length);
  processQueue();
});

function processQueue() {
  if (queue.length === 0) {
    console.log('All done');
    return;
  }

  var pageUrl = queue.shift();
  console.log('Indexing ' + pageUrl);

  getPage(pageUrl)
    .then(parseBestSellerPage)
    .then(x => {
      x.id = pageUrl;
      outgoing.write(x);
      enqueueWhatIsNeeded(x.children);

      console.log('Saved ' + pageUrl + '. Queue size: ' + queue.length);
      processQueue();
    });
}

function readIndexedSoFar() {
  var queue = [];
  if (!fs.existsSync(processedFileName)) {
    queue.push(defaultStartFrom);

    return Promise.resolve({ queue });
  }

  return readIndexedPages().then(buildQueue)
}

function buildQueue() {
  indexedSoFar.forEach((treeChildren) => {
    enqueueWhatIsNeeded(treeChildren);
  });

  return {
    queue
  }
}


function enqueueWhatIsNeeded(treeChildren) {
  treeChildren.forEach(child => {
    if (indexedSoFar.has(child.href)) return;
    if (enqueued.has(child.href)) return;
    enqueued.add(child.href);
    queue.push(child.href);
  });
}

function readIndexedPages() {
  var dupesCount = 0;

  console.log('Parsing indexed pages...');
  return new Promise(resolve => {
    fs.createReadStream(processedFileName)
      .pipe(JSONStream.parse())
      .pipe(es.mapSync(markProcessed))
      .on('end', done);

    function markProcessed(page) {
      if (indexedSoFar.has(page.id)) {
        dupesCount += 1;
      }
      indexedSoFar.set(page.id, page.children);
    }

    function done() {
      console.log('Read ' + indexedSoFar.size + ' pages. Dupes: ' + dupesCount);
      resolve();
    }
  })
}

function createOutStream() {
  var outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(processedFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);

  return outgoing;
}
