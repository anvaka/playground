// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import createPredictor from './lib/predictor';

  new Vue({
    el: '#app',
    components: { App },
    template: '<App/>'
  });

Vue.config.productionTip = false

function runAnimation(canvas, data) {
  let width = 640;
  let height = 480;
  let maxBands = 288;
  const MISSING = 4200000000; // If post didn't have score, its value is larger than this
  let postCount = data.length / maxBands;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const bandDist = collectBandsDistribution(data);

  canvas.addEventListener('mousemove', handleMouseMove);

  function handleMouseMove(e) {
    let {clientX, clientY} = e;
    let bandIndex = Math.floor(maxBands * clientX/width);
    if (bandIndex >= maxBands) return;
    let distribution = bandDist[maxBands - 1];
    let score = (distribution.max - distribution.min) * (1 - clientY / height);
    const nearest = findNeighborsInBand(score, bandIndex, 10);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.fillRect(width * bandIndex / maxBands - 2, height * (1 - score / (distribution.max - distribution.min)) - 2, 4, 4);
    ctx.stroke();

    let top = nearest.splice(0, 1)
    console.log(bandIndex, score, nearest.map(x => x.id + ' - ' + x.distance).join('; '));
    nearest.forEach(x => drawSeries(x.id, '#99999933'));
    top.forEach(x => drawSeries(x.id, '#004466'));

    function drawSeries(seriesId, color = '#333') {
      ctx.beginPath();
      ctx.strokeStyle = color;
      let moved = false;
      for (let i = 0; i < maxBands; ++i) {
        let value = data[maxBands * seriesId + i];
        if (value > MISSING) continue;
        let distribution = bandDist[maxBands - 1];
        let y = Math.round(height * (1 - value / (distribution.max - distribution.min)));
        let x = Math.floor( width * i / maxBands);
        if (moved) ctx.lineTo(x, y);
        else {
          ctx.moveTo(x, y)
          moved = true;
        }
      }
      ctx.stroke();
    }
  }

  function collectBandsDistribution(data) {
    let distributions = [];
    for (let i = 0; i < maxBands; ++i) {
      distributions.push(getBandStats(data, i));
    }
    return distributions;
  }

  function findNeighborsInBand(currentValue, currentBand, neighborsCount = 3) {
    let values = [];
    for (let id = 0; id < postCount; ++id) {
      let value = data[id * maxBands + currentBand];

      if (value > MISSING) continue;
      values.push({
        id,
        distance: Math.abs(value - currentValue)
      });
    }
    values.sort((a, b) => {
      return (a.distance - b.distance);
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


  function getBandStats(data, band) {
    let scores = [];
    for (let i = 0; i < postCount; ++i) {
      const value = data[i * maxBands + band]
      if (value > MISSING) continue;

      scores.push({
        id: i,
        value: value
      });
    }
    scores.sort((a, b) => a.value - b.value);

    return {
      scores,
      min: scores[0].value,
      max: scores[scores.length - 1].value
    }
  }
}
