const STRIDE = 288; // How many records per row we have
const MISSING = 4200000000; // If post didn't have score, its value is larger than this
// export default function createPredictor(buffer) {
module.exports = function createPredictor(data, nToConsider = 4, eps = 1e-6) {
  let postCount = data.length / STRIDE;
  if (Math.round(postCount) !== postCount) {
    throw new Error('Invalid buffer size');
  }

  return {
    predictScore(currentValue, currentBand, finalBand) {
      if (currentBand >= STRIDE) {
        throw new Error('Band is out of range');
      }
      // let neighbors = findNeighborsInBand({band: currentBand, score: currentValue});

      let band = currentBand;
      let score = currentValue;
      while (band < finalBand) {
        let bands = {band, score}
        let vec = getVector(bands);
        band += 1;
        score = vec + score;
      } 
      return {
        median: score
      }
      // return getStatsFromNeighbors(neighbors, finalBand);
    }
  }

  function getVector(bandAndScore) {
    if (bandAndScore.band >= STRIDE - 1) {
      return 0;
    }
    let neighbors = findNeighborsInBand(bandAndScore, nToConsider);
    let vectors = neighbors.map(post => {
      let currentValue = getPostValueAtBand(post.postId, bandAndScore.band);
      let nextValue = getPostValueAtBand(post.postId, bandAndScore.band + 1);
      return {
        y: nextValue - currentValue,
        d: post.distance
      }
    }).filter(v => Number.isFinite(v.y));

    let result = 0;
    vectors.forEach(v => {
      result += v.y * rbf(v.d);
    });

    return result/vectors.length;
  }

  function getStats(bandAndScore, neighborsCount) {
    let neighbors = findNeighborsInBand(bandAndScore, neighborsCount);
    return getStatsFromNeighbors(neighbors, STRIDE - 1);
  }

  function getStatsFromNeighbors(neighbors, atBandValue) {
    let scores = neighbors.map(post => getPostValueAtBand(post.postId, atBandValue)).filter(x => x);
    scores.sort((a, b) => a - b);
    let avg = scores.reduce((prev, current) => prev + current, 0) / scores.length;

    return {
      count: scores.length,
      median: scores[Math.floor(scores.length / 2)],
      avg,
    };
  }

  function findNeighborsInBand(bandAndScore, neighborsCount = 3) {
    if (!bandAndScore) return [];
    let allNeighbors = _getAllSortedNeighborsInBand(bandAndScore);
    return _getUniqueNearestNeighbors(allNeighbors, neighborsCount);
  }

  function _getAllSortedNeighborsInBand(bandAndScore) {
    const values = [];
    for (let postId = 0; postId < postCount; ++postId) {
      let postScore = getPostValueAtBand(postId, bandAndScore.band);
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

  function _getUniqueNearestNeighbors(allNeighbors, neighborsCount) {
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


  function getPostValueAtBand(postId, band) {
    let value = data[STRIDE * postId + band];
    if (value > MISSING) return;
    return value;
  }
function rbf(r) {
  return  1./(1 + r * r*eps);
  return Math.exp(-r * r * 1e-7);
}
}