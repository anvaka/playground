/**
 * This file merges two subreddit commenters into one. It also
 * likely has a bug
 */
const lineByLine = require('n-readlines');

var files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Pass file names to process');
  process.exit(1);
}

var readers = files.map(toInitializedReader);
console.warn('Initialized with ', files);

var idx = 0;
var lastCommentorAggregator = undefined;

class CommenterAggregator {
  constructor(commentor) {
    this.subreddits = new Map();
    this.user = commentor.user;
    this.subreddits.set(commentor.subreddit, commentor.count);
  }

  printAll() {
    this.subreddits.forEach((count, subreddit) => {
      console.log(this.user + ',' + subreddit + ',' + count);
    });
  }

  merge(otherCommentor) {
    if (otherCommentor.user !== this.user) {
      throw new Error('Wrong name ' + otherComment.user + ' !== ' +  this.user);
    }

    this.subreddits.set(otherCommentor.subreddit,
      (this.subreddits.get(otherCommentor.subreddit) || 0) + otherCommentor.count
    );
  }
}

do {
  var nextReader = getReaderWithNextLine(readers);
  if (!nextReader) break;

  var currentCommenter = nextReader.lastCommenter()
  // console.log(nextReader.fileName + ': ' + nextReader.lastLine());
  if (lastCommentorAggregator && lastCommentorAggregator.user !== currentCommenter.user) {
//     console.log('printAll', nextReader.lastLine());
    lastCommentorAggregator.printAll();
    lastCommentorAggregator = new CommenterAggregator(currentCommenter);
  } else if (lastCommentorAggregator) {
    lastCommentorAggregator.merge(currentCommenter);
  } else {
    lastCommentorAggregator = new CommenterAggregator(currentCommenter);
  }

  if (!nextReader.next()) {
    // this one is over.
    removeReader(nextReader);
  }
  idx += 1;
} while (true);

function reomveReader(reader) {
  let readerIndex = readers.indexOf(reader);
  readers.splice(readerIndex, 1);
}

function getReaderWithNextLine(readers) {
  readers.sort(readerIsNext);
  return readers[0];
}

function readerIsNext(current, candidate) {
  let candidateCommenter = candidate.lastCommenter();
  let currentCommenter = current.lastCommenter();

  let userDiff = candidateCommenter.user.localeCompare(currentCommenter.user);
  if (userDiff) return -userDiff;

  let subredditDiff = candidateCommenter.subreddit.localeCompare(currentCommenter.subreddit);
  if (subredditDiff) return subredditDiff;

  var countDiff = candidateCommenter.count - currentCommenter.count;
  if (countDiff) return countDiff;

  return (candidate.fileName.localeCompare(current.fileName));
}

function toLastLine(reader) {
  return reader.line();
}

function toInitializedReader(fileName) {
  var reader = createFileReader(fileName)
  reader.next();

  return reader;
}

function createFileReader(fileName) {
  var finished = false;
  var line;
  var commenter = {
    user: undefined,
    subreddit: undefined,
    count: 0
  };

  const liner = new lineByLine(fileName);

  return {
    lastCommenter,
    lastLine,
    next,
    isFinished,
    fileName
  }

  function isFinished() {
    return finished;
  }

  function lastCommenter() {
    return commenter;
  }
  function lastLine() {
    return line;
  }

  function next() {
    let lastBuff = liner.next();
    if (!lastBuff) {
      finished = true;
      return false;
    }
    line = lastBuff.toString('utf8');
    let parts = line.split(',');
    if (parts.length !== 3) throw new Error('invalid format ' + line);

    commenter.user = parts[0];
    commenter.subreddit = parts[1];
    commenter.count = Number.parseInt(parts[2], 10);
    if (!Number.isFinite(commenter.count)) throw new Error('Invalid count ' + line);

    return true;
  }
}
