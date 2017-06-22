// var JSONStream = require('JSONStream');
// var es = require('event-stream');
const subredditsFile = process.argv[2] || 'subreddits.txt';
const downloadedFile = process.argv[3] || 'abouts.json';
const forEachSub = require('./lib/forEachSub.js');
const downloadAbout = require('./lib/download-about.js');

let work = [];
let workIndex = 0;
let parallelCalls = 10;
let startTime;

const outStream = makeDownloadedFile(downloadedFile); 

readDownloaded().then(readAllSubs).then(r => {
  console.log('loaded ' + r.length);
  work = r;

  startTime = new Date();
  return startIndex();
}).catch(e => console.log('error', e));

function startIndex() {
  return getAbout().then((hasMore) => {
    if (!hasMore) {
      console.log('Wow, you made it! All done.');
      return;
    }

    let avgTimePerSubredditMs = (new Date() - startTime)/workIndex;
    let subredditsPerSecond = 1000 / avgTimePerSubredditMs;
    let subredditsPerMinute = subredditsPerSecond * 60;

    workIndex += parallelCalls;

    console.log('Chunk complete, advancing index to ' + workIndex + '; Speed: ' + subredditsPerMinute + ' subreddits per minute');
    return startIndex()
  });
}

function getAbout() {
  let chunk = work.slice(workIndex, workIndex + parallelCalls)
    .map(name => {
      return downloadAbout(name).then(saveAbout);
    });

  if (chunk.length === 0) {
    console.log('Done');
    return Promise(resolve => resolve(false));
  }

  return Promise.all(chunk).then(() => true);
}

function saveAbout(about) {
  if (!about) throw new Error('Missing about');

  outStream.write(about);
}

function makeDownloadedFile(downloadedFile) {
  const JSONStream = require('JSONStream');
  const fs = require('fs');

  const outgoing = JSONStream.stringify(false);
  const fileStream = fs.createWriteStream(downloadedFile, {
    encoding: 'utf8',
    flags: 'a'
  });

  outgoing.pipe(fileStream);

  return outgoing;
}

function readDownloaded() {
  const fs = require('fs');
  const found = new Set();

  return new Promise(resolve => {
    if (!fs.existsSync(downloadedFile)) {
      resolve(found);
      return;
    }

    forEachSub(downloadedFile, about => {
      found.add(about.display_name.toLowerCase())
    }, () => resolve(found));
  })
}

function readAllSubs(downloaded) {
  return new Promise((resolve, reject) => {
    console.log('reading subreddits file ' + subredditsFile);
    const queue = [];
    const readline = require('readline');
    const fs = require('fs');

    const rl = readline.createInterface({
      input: fs.createReadStream(subredditsFile)
    });

    rl.on('line', (line) => {
      let match = line.match(/https:\/\/www.reddit.com\/r\/([a-zA-Z0-9_.:\-]+)\//);
      if (!match) {
        console.error('Cannot find subreddint name in line ' + line);
        console.error('Please fix the regex!');
        return;
      }
      let subName = match[1].toLowerCase();
      if (!downloaded.has(subName)) queue.push(subName);
    });

    rl.on('close', () => {
      console.log('Loaded subreddits file in memory. Found: ' + queue.length + ' subs');
      resolve(queue);
    });
    rl.on('error', reject);
  });
}
