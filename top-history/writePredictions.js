const neighborsCount = 12;
const postIndex = require('./postIndex.json')
const bandScores = require('./scores.json')
//const postId = ''+postIndex['/r/dataisbeautiful/comments/cqbse4/google_trends_forecasting_oc/'];
const postId = ''+postIndex['/r/dataisbeautiful/comments/d622lv/moved_countries_heres_six_months_of_job_hunting/'];


let predictions = [];
let fromBand = 200;
bandScores.forEach((band, bandNumber) => {
  if (bandNumber === bandScores.length - 1) return;
  const trueValue = band[postId];
  if (bandNumber <= fromBand) {
    predictions.push([bandNumber, trueValue, 0, 0, 0, 0]);
    return;
  }
  // const predictedNextValue = predict(trueValue, bandNumber);
  const stats = collectStats(trueValue, fromBand, bandNumber);
  predictions.push([bandNumber, trueValue, stats.avg, stats.mean, stats.q1, stats.q3]);
});

predictions = smoothOut(predictions);


console.log('band,true_value,avg,mean,q1,q3')
console.log(predictions.map(x => x.join(',')).join('\n'))

function smoothOut(predictions, alpha = 0.8) {
  let smoothedOut = [];
  for (let i = 0; i < predictions.length; ++i) {
    let row = predictions[i];
    if (i === 0) {
      smoothedOut.push(row);
    } else {
      let prev = smoothedOut[i - 1];
      smoothedOut.push([
        row[0], // band number
        row[1], // true value
        row[2] * alpha + (1 - alpha) * prev[2] , // avg
        row[3] * alpha + (1 - alpha) * prev[3] , // mean
        row[4] * alpha + (1 - alpha) * prev[4] , // q1
        row[5] * alpha + (1 - alpha) * prev[5] , // q3
      ])
    }
  }
  return smoothedOut;
}

function collectStats(trueValue, fromBand, toBand) {
  let neighbors = findNeighborsInBand(trueValue, fromBand)
  return getBandStats(neighbors, toBand);
}

function predict(currentValue, bandNumber) {
  let neighbors = findNeighborsInBand(currentValue, bandNumber)
  const stats = getBandStats(neighbors, bandNumber + 1)
  return stats.avg;
}

function getBandStats(neighbors, bandNumber) {
  let band = bandScores[bandNumber];
  let values = neighbors.map(x => band[x.id]).filter(x => Number.isFinite(x));
  let count = values.length;
  values.sort((a, b) => a - b);
  let avg = values.reduce((sum, x) => sum + x, 0) / count;
  return {
    avg, 
    mean: values[Math.floor(values.length / 2)],
    q1: values[Math.floor(values.length / 4)],
    q3: values[Math.floor(values.length * 3 / 4)],
  }
}

function findNeighborsInBand(value, bandNumber) {
  let band = bandScores[bandNumber];
  let values = Object.keys(band).map(key => {
    if (key === postId) {
      return {
        dist: Number.POSITIVE_INFINITY
      };
    }

    return {
      id: key, 
      dist: band[key] - value
    };
  });
  values.sort((a, b) => {
    return Math.abs(a.dist) - Math.abs(b.dist);
  })
  if (values.length < neighborsCount) {
    console.error('Not enough data');
  }
  let index = 0;
  let lastDistance = undefined;
  let next = values[index];
  let result = [];
  while (next && (
    (next.dist === lastDistance) ||
    result.length < neighborsCount)
   ) {
    lastDistance = next.dist;
    result.push(next);
    index += 1;
    next = values[index];
  }
  return result;
}