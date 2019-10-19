/**
 * "Archive" is a data structure that represents set of reddit posts to a subreddit.
 * Its main responsibility is to provide nearest posts to a post with given score.
 */
const MISSING = 4200000000; // If post didn't have score, its value is larger than this
const STRIDE = 288;
const LAST_BAND = STRIDE - 1;
const EMPTY = [];

export default class Archive {
  constructor(data) {
    this.STRIDE = STRIDE;

    this.data = data;
    let postCount = data.length / STRIDE;
    if (Math.round(postCount) !== postCount) {
      throw new Error('Unexpected archive format');
    }

    this.postCount = postCount;

    const scores = this._getMinMaxScoreInArchive();
    this.minScore = scores.minScore;
    this.maxScore = scores.maxScore;
  }

  getPostValueAtBand(postId, band) {
    let value = this.data[STRIDE * postId + band];
    if (value > MISSING) return;
    return value;
  }

  getVector(bandAndScore) {
    if (bandAndScore.band >= LAST_BAND) {
      return 0;
    }
    let neighbors = this.findNeighborsInBand(bandAndScore, 3);
    let vectors = neighbors.map(post => {
      let currentValue = this.getPostValueAtBand(post.postId, bandAndScore.band);
      let nextValue = this.getPostValueAtBand(post.postId, bandAndScore.band + 1);
      return {
        y: nextValue - currentValue,
        d: post.distance * post.sign
      }
    }).filter(v => Number.isFinite(v.y));


    let mean = vectors.reduce((p, c) => p + c.d, 0)/vectors.length;
    let std = vectors.reduce((p, c) => p + (c.d - mean) * (c.d - mean), 0) / vectors.length;
    std = Math.sqrt(std);

    let result = 0;
    vectors.forEach(v => {
      let zScore = (v.d - mean)/std;
      v.std = zScore;
      result += v.y * rbf(zScore);
    });

    return result/vectors.length;
  }

  getStats(bandAndScore, neighborsCount) {
    let neighbors = this.findNeighborsInBand(bandAndScore, neighborsCount);
    return this.getStatsFromNeighbors(neighbors, LAST_BAND);
  }

  getStatsFromNeighbors(neighbors, atBandValue) {
    let scores = neighbors.map(post => this.getPostValueAtBand(post.postId, atBandValue)).filter(x => x);
    scores.sort((a, b) => a - b);
    let avg = scores.reduce((prev, current) => prev + current, 0) / scores.length;

    return {
      count: scores.length,
      median: scores[Math.floor(scores.length / 2)],
      avg,
    };
  }

  findNeighborsInBand(bandAndScore, neighborsCount = 3) {
    if (!bandAndScore) return EMPTY;
    let allNeighbors = this._getAllSortedNeighborsInBand(bandAndScore);
    return this._getUniqueNearestNeighbors(allNeighbors, neighborsCount);
  }

  getPostHistory(postId) {
    if (postId < 0 || postId > this.postCount || !Number.isFinite(postId)) {
      throw new Error('PostId is out of range: ' + postId);
    }

    let history = [];

    for (let band = 0; band < STRIDE; ++band) {
      let score = this.getPostValueAtBand(postId, band);
      if (score === undefined) continue;
      history.push({band, score});
    }

    return history;
  }

  _getUniqueNearestNeighbors(allNeighbors, neighborsCount) {
    let neighborIndex = 0;
    let lastDistance;
    let next = allNeighbors[neighborIndex];
    let result = [];
    let uniqueCount = 0;

    // we want to get `neighborsCount` with unique scores.
    while (next && 
      ((next.distance === lastDistance) || (uniqueCount < neighborsCount))
    ) {

      if ((result.length === 0) || (lastDistance !== next.distance)) uniqueCount += 1;

      lastDistance = next.distance;
      result.push(next);

      next = allNeighbors[++neighborIndex];
    }

    return result;
  }

  _getAllSortedNeighborsInBand(bandAndScore) {
    const values = [];
    for (let postId = 0; postId < this.postCount; ++postId) {
      let postScore = this.getPostValueAtBand(postId, bandAndScore.band);
      if (postScore === undefined) continue;
      // let value = this.getPostValueAtBand(postId, LAST_BAND);
      // if (value === undefined || value < bandAndScore.score) continue;

      values.push({
        postId,
        distance: Math.abs(postScore - bandAndScore.score),
        sign: Math.sign(postScore - bandAndScore.score)
      });
    }

    values.sort((a, b) => a.distance - b.distance);
    return values;
  }

  _getMinMaxScoreInArchive() {
    let minScore = Number.POSITIVE_INFINITY;
    let maxScore = Number.NEGATIVE_INFINITY;
    for (let postId = 0; postId < this.postCount; ++postId) {
      for (let band = 0; band < STRIDE; ++band) {
        let value = this.getPostValueAtBand(postId, band);
        if (value === undefined) continue;
        if (value < minScore) minScore = value;
        if (value > maxScore) maxScore = value;
      }
    }

    return {minScore, maxScore};
  }
}

function rbf(r) {
  

  // return 1/(1 + r*r);//1./(1);
  return Math.exp(-r * r * 1e-8);
}