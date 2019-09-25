const STRIDE = 288; // How many records per row we have
const MISSING = 4294967295; // If post didn't have score, its value is equal to this

export default function createPredictor(buffer) {
//module.exports = function createPredictor(buffer) {
  let bandCount = buffer.length / STRIDE;
  let neighborsCount = 10;
  if (Math.round(bandCount) !== bandCount) {
    throw new Error('Invalid buffer size');
  }

  return {
    predictScore(currentValue, currentBand, finalBand) {
      if (currentBand >= STRIDE) {
        throw new Error('Band is out of range');
      }
      let neighbors = findNeighborsInBand(currentValue, currentBand)
      return getBandStats(neighbors, finalBand);
    }
  }

  function getBandStats(neighbors, finalBand) {
    let values = neighbors.map(x => {
      let value = buffer[x.id * STRIDE + finalBand];
      return value === MISSING ? Number.NaN : value;
    }).filter(x => Number.isFinite(x));

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

  function findNeighborsInBand(currentValue, currentBand) {
    let values = [];
    for (let id = 0; id < bandCount; ++id) {
      let value = buffer[id * STRIDE + currentBand];

      if (value === MISSING) continue;
      values.push({
        id,
        distance: Math.abs(value - currentValue)
      });
    }
    values.sort((a, b) => {
      return a.distance - b.distance;
    })
    if (values.length < neighborsCount) {
      console.error('Not enough data');
    }
    let index = 0;
    let lastDistance;
    let next = values[index];
    let result = [];
    let uniqueCount = 0;
    while (next && (
      (next.distance === lastDistance) ||
      uniqueCount < neighborsCount)
    ) {
      if (result.length === 0 || 
          (lastDistance !== next.distance)
        ) {
        uniqueCount += 1;
      }
      lastDistance = next.distance;
      result.push(next);
      index += 1;
      next = values[index];
    }
    return result;
  }
}