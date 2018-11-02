/**
 * This file processes redditor's comments files and produces a list of all
 * subreddits startin with a `startFrom` letter along with all similar subreddits
 * (similar subreddits can start on any letter).
 *
 * The reason for such "strange" design is becuase I cannot fit the entire
 * index in RAM. However I can easily fit index for all subreddits that start
 * on a given letter. This allows to process similarities in parallel batches too
 */

// This file should be produced by 0.collect_data.sh script. It lists
// all users grouped by (user_id, subreddit_name), along with number of posts
// into each subreddit.
// Important assumption is that users are sorted in this file. This allows
// me to count similarity without a need to keep track where each user posted.
// (I.e. as long as user name the same, all subreddits that I see are "similar",
// degree of similarity is determined once we process the entire file)
var fileName = 'reddit_aug_2018'

// maps pair of subreddits into `Counter` object. I use object and not a Map
// because Map in my node crashes with out of memory sooner ¯\_(ツ)_/¯
var keyToCount = {};

// Gives number of unique commenters for each subreddit.
var commentersCount = new Map();

// Once all file is processed we store here list 
var indexedSimilarity = new Map();

// this is passed by ./index_by_letter.js
var startFrom = process.argv[2] || 'a';

var path = require('path');
var fs = require('fs');
var JSONStream = require('JSONStream');

var outStream = createOutStream(path.join('data', 'related-' + startFrom.toLowerCase() + '.json'));

let forEachLine = require('for-each-line');
var lineCount = 0;

// This class counts total number of mutual commenters to pair of subreddits
class Counter {
  constructor(subA, subB) {
    this.subA = subA;
    this.subB = subB;
    this.sim = 0;
    this.count = 0;
  }

  increase(instanceSimilarity) {
    this.sim += instanceSimilarity;
    this.count += 1;
  }
}

var lastUser = null;
var lastUserSubs;
var writeOutputFor = new Set();

function shouldBeIndexed(sub) {
  return sub[0] === startFrom;
}

forEachLine(fileName, (line) => {
  if (!line) return;

  lineCount += 1;
  if (lineCount % 500000 === 0) console.log('Indexed lines: ', lineCount, line);
  var parts = line.split(',')
  var user = parts[0];
  var sub = parts[1];
  var count = Number.parseInt(parts[2], 10);
  if (!user) {
    throw new Error('Something is wrong with this line: ' + line);
  }
  if (!Number.isFinite(count)) {
    console.warn('skipping ' + line + ' - invalid count');
    return;
  }

  commentersCount.set(sub, (commentersCount.get(sub) || 0) + 1);

  if (lastUser !== user) {
    recordLastUser(lastUserSubs);
    lastUser = user;
    lastUserSubs = [];
  }
  lastUserSubs.push({sub, count});
}).then(() => {
  console.log('all indexed');
  Object.keys(keyToCount).forEach(indexSimilarity);
}).then(() => {
  writeOutputFor.forEach(subreddit => {
    var sims = getSimilarTo(subreddit);
    if (sims.similar.length > 0) outStream.write(sims);
  });
})

/**
 * This method would take top 100 similar subreddits, and then it will
 * cut subreddit with similarity score below `mean + standard_deviation`.
 * Usually this gives nice bounds for the threshold.
 */
function getSimilarTo(subName) {
  var similar = indexedSimilarity.get(subName);
  similar.sort((a, b) => b.score - a.score)
  similar = similar.slice(0, 100);

  var mean = 0;
  similar.forEach(x => mean += x.score);
  mean /= similar.length;

  var stdDev = 0;
  similar.forEach(x => stdDev += (x.score - mean) * (x.score - mean));
  stdDev /= similar.length;
  stdDev = Math.sqrt(stdDev);

  var medianIndex = Math.floor(similar.length/2);
  var median = similar[medianIndex].score;

  var foundMatches = []
  for (var i = 0; i < similar.length; ++i) {
    var sim = similar[i];
    if (sim.score - median > stdDev) {
      foundMatches.push({
        sub: sim.sub,
        score: sim.score
      })
    } else {
      // since array is sorted, there is nothing interesting left at this point
      break;
    }
  }

  return {
    name: subName,
    similar: foundMatches
  }
}

function indexSimilarity(subredditPairKey) {
  var counter = keyToCount[subredditPairKey];

  // Regular Jaccard similarity:
  var similarity = counter.count/(commentersCount.get(counter.subA) + commentersCount.get(counter.subB) - counter.count);

  // Similarity is bi-directional. We store both ends of the edge into file:
  var aSims = indexedSimilarity.get(counter.subA);
  if (!aSims) {
    aSims = [];
    indexedSimilarity.set(counter.subA, aSims);
  }
  aSims.push({
    sub: counter.subB,
    score: similarity
  });

  var bSims = indexedSimilarity.get(counter.subB);
  if (!bSims) {
    bSims = [];
    indexedSimilarity.set(counter.subB, bSims);
  }

  bSims.push({
    sub: counter.subA,
    score: similarity
  });
}

function recordLastUser(subs) {
  if (!subs) return;
  if (subs.length < 2) return;
  var total = 0;
  for (var i = 0; i < subs.length; ++i) {
    total += subs[i].count;
  }

  for (var i = 0; i < subs.length - 1; ++i) {
    var subA = subs[i];
    for (var j = i + 1; j < subs.length; ++j) {
      var subB = subs[j];

      var processThisPair = false;
      if (shouldBeIndexed(subA.sub)) {
        writeOutputFor.add(subA.sub);
        processThisPair = true;
      }
      if (shouldBeIndexed(subB.sub)) {
        writeOutputFor.add(subB.sub);
        processThisPair = true;
      }
      if (!processThisPair) {
        continue;
      }

      var key = makeKey(subA.sub, subB.sub);
      let scores = keyToCount[key];
      if (!scores) {
        scores = new Counter(subA.sub, subB.sub);
        keyToCount[key] = scores;
      }

      var na = subA.count/total;
      var nb = subB.count/total;

      scores.increase((na + nb)/2);
    }
  }
}

function makeKey(subA, subB) {
  return subA < subB ? subA + '|' + subB : subB + '|' + subA;
}

function createOutStream(outFileName) {
  var outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);
  return outgoing;
}
