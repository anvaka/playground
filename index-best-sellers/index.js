var getPage = require('./lib/getPage');
var parseBestSellerPage = require('./lib/parseBestSellerPage');
var processedFileName = 'data/books.json';

var es = require('event-stream');
var fs = require('fs');
var JSONStream = require('JSONStream');

var defaultStartFrom = 'https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/';
var queue = [];
var outgoing;

// We likely not gonna need this - it looks to be a tree, not a graph, so there should be
// no cycles.
var indexedSoFar = new Map();

readIndexedSoFar().then(crawlInfo => {
  queue = crawlInfo.queue;
  indexedSoFar = crawlInfo.indexedPages;
  outgoing = createOutStream();

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
  var indexedPages = new Map();
  if (!fs.existsSync(processedFileName)) {
    queue.push(defaultStartFrom);

    return Promise.resolve({ indexedPages, queue });
  }

  return readIndexedPages().then(buildQueue)
}

function buildQueue(indexedPages) {
  indexedPages.forEach((treeChildren) => {
    enqueueWhatIsNeeded(treeChildren);
  });

  return {
    queue, indexedPages
  }
}


function enqueueWhatIsNeeded(treeChildren) {
  treeChildren.forEach(child => {
    if (indexedSoFar.has(child.href)) return;
    queue.push(child.href);
  });
}

function readIndexedPages() {
  var indexedPages = new Map();

  console.log('Parsing indexed pages...');
  return new Promise(resolve => {
    fs.createReadStream(processedFileName)
      .pipe(JSONStream.parse())
      .pipe(es.mapSync(markProcessed))
      .on('end', done);

    function markProcessed(page) {
      indexedPages.set(page.id, page.children);
    }

    function done() {
      console.log('Read ' + indexedPages.size + ' pages');
      resolve(indexedPages);
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
