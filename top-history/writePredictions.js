const neighborsCount = 9;
const postIndex = require('./postIndex.json')
const bandScores = require('./scores.json')
const postId = ''+postIndex['/r/dataisbeautiful/comments/cynql1/moores_law_graphed_vs_real_cpus_gpus_1965_2019_oc/'];
// const postId = ''+postIndex['/r/dataisbeautiful/comments/d622lv/moved_countries_heres_six_months_of_job_hunting/'];


let predictions = [];
let maxBand = 286;

let bandPredictions = [];
for (let fromBand = 0; fromBand < 285; ++fromBand) {
  const trueValue = bandScores[fromBand][postId];
  let q1 = fillNA(fromBand);
  let mean = fillNA(fromBand);
  let q3 = fillNA(fromBand);
  for (let toBand = fromBand + 1; toBand < maxBand; ++toBand ) {
    const stats = collectStats(trueValue, fromBand, toBand);
    mean.push(stats.avg);
    q1.push(stats.q1);
    q3.push(stats.q3);
  }

  predictions = smoothOut(predictions);
  bandPredictions.push({
    q1: smoothOut(q1),
    q3: smoothOut(q3),
    mean: smoothOut(mean)
  });
}
console.log(JSON.stringify({
  trueValues: bandScores.map(band => band[postId]),
  predictions: bandPredictions
}));

function fillNA(length) {
  let result = [];
  let i = 0;
  while (i < length) {
    result[i] = '-';
    i++;
  }

  return result;
}

// let fromBand = 200;
// bandScores.forEach((band, bandNumber) => {
//   if (bandNumber === bandScores.length - 1) return;
//   const trueValue = band[postId];
//   if (bandNumber <= fromBand) {
//     predictions.push([bandNumber, trueValue, 0, 0, 0, 0]);
//     return;
//   }
//   // const predictedNextValue = predict(trueValue, bandNumber);
//   const stats = collectStats(trueValue, fromBand, bandNumber);
//   predictions.push([bandNumber, trueValue, stats.avg, stats.mean, stats.q1, stats.q3]);
// });

// predictions = smoothOut(predictions);


// console.log('band,true_value,avg,mean,q1,q3')
// console.log(predictions.map(x => x.join(',')).join('\n'))

function smoothOut(values, alpha = 0.4) {
  let smoothedOut = [];
  for (let i = 0; i < values.length; ++i) {
    let row = values[i];
    if (i === 0 || row === '-' || smoothedOut[i - 1] === '-') {
      smoothedOut.push(row);
    } else {
      let prev = smoothedOut[i - 1];
      smoothedOut.push(row * alpha + (1 - alpha) * prev);
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