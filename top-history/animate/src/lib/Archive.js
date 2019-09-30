/**
 * "Archive" is a data structure that represents set of reddit posts to a subreddit.
 * Its main responsibility is to provide nearest posts to a post with given score.
 */
const MISSING = 4200000000; // If post didn't have score, its value is larger than this
const STRIDE = 288;

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

  findNeighborsInBand(bandAndScore, neighborsCount = 3) {
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
      values.push({
        postId,
        distance: Math.abs(postScore - bandAndScore.score)
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