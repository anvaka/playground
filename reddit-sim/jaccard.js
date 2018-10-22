// maps pair to aggregated average
var keyToCount = {};
var votersCount = new Map();
var indexedSimilarity = new Map();

let forEachLine = require('for-each-line');
var searchSubName = 'proceduralgeneration';
var lineCount = 0;
var redditToNumber = {};
var rcount = 0;

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
var fileName = 'reddit_aug_2018'
var lastUser = null;
var lastUserSubs;

forEachLine(fileName, (line) => {
  if (!line) return;

  lineCount += 1;
  if (lineCount >= 3674204) {
    if (lineCount % 50000 === 0) console.log('Indexed lines: ', lineCount, line);
  }
  var parts = line.split(',')
  var user = parts[0];
  var sub = parts[1];
  var subNumber = redditToNumber[sub];
  if (subNumber === undefined) {
    subNumber = rcount;
    rcount += 1;
    redditToNumber[sub] = subNumber;
  }
  sub = subNumber;
  var count = Number.parseInt(parts[2], 10);
  if (!user) {
    throw new Error('Something is wrong with this line: ' + line);
  }
  if (!Number.isFinite(count)) {
    console.warn('skipping ' + line + ' - invalid count');
    return;
  } 

  votersCount.set(sub, (votersCount.get(sub) || 0) + 1);

  if (lastUser !== user) {
    recordLastUser(lastUserSubs);
    lastUser = user;
    lastUserSubs = [];
  }
  lastUserSubs.push({sub, count});
}).then(() => {
  console.log('all indexed');
  Object.keys(keyToCount).forEach(indexSimilarity);

  var similar = indexedSimilarity.get(searchSubName);
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

  console.log(mean, median, stdDev)

  for (var i = 0; i < similar.length; ++i) {
    var sim = similar[i];
    if (sim.score - median > stdDev) {
      console.log(sim.sub + '\t' + sim.score);
    } else {
      break;
    }
  }
})

function indexSimilarity(key) {
  var counter = keyToCount[key];
  var similarity = counter.count/(votersCount.get(counter.subA) + votersCount.get(counter.subB) - counter.count);

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

      var shouldIndex = true; //subA.sub[0] === 'a' || subB.sub[0] === 'a'; // true; // (subA.sub === searchSubName || subB.sub ===searchSubName);
      if (!shouldIndex) {
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

