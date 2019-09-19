<template>
  <div id="app">
    <div id="main" style="width:800px; height:600px;"></div>
  </div>
</template>

<script>
import Relist from './components/Relist';
import echarts from 'echarts';


export default {
  name: 'App',

  components: {
    Relist
  },

  mounted() {
    const story = window.story;
    let myChart = echarts.init(document.getElementById('main'));
    let xAxis = story.map(pair => pair[0])
    let trueValue = story.map(pair => '-'); // pair[1])
    let lastProcessed = -1;
    let series = [];
    // window.story.forEach(pair => {
    //   makePredictions(pair[0], pair[1], series);
    // })
    series.push({
        name: 'True score',
        type: 'line',
        data: trueValue,
        showSymbol: false,
        lineStyle: {
          width: 2,
        }
    })

    // specify chart configuration item and data
    var option = {
        animation: false,
        title: {
            text: 'ECharts entry example'
        },
        xAxis: {
            data: xAxis
        },
        yAxis: {
          min: 0,
          max: story[story.length - 1][1] * 1.2
        },
        series
    };

    // use configuration item and data specified to show chart
    const seriesBuffer = createDecayingSeriesBuffer(series, 5);
    myChart.setOption(option);
    frame();

    function frame() {
      lastProcessed += 1;
      if (lastProcessed < story.length - 1) {
        setTimeout(() => requestAnimationFrame(frame), 50);
      }
      const pair = story[lastProcessed];
      trueValue[lastProcessed] = pair[1]
      makePredictions(pair[0], pair[1], seriesBuffer);
      myChart.setOption(option);
    }
  }
}

function createDecayingSeriesBuffer(trueSeries, count) {
  let offset = 1;
  let nextIndex = 0;
  return {
    push(series) {
      for (let i = 0; i < count; ++i) {
        const prevSeries = trueSeries[offset + i];
        if(prevSeries) prevSeries.lineStyle.opacity *= 0.999;
      }

      trueSeries[offset + nextIndex] = series;
      nextIndex += 1;
      if (nextIndex >= count) nextIndex = 0;
    }
  }

}

function makePredictions(band, score, appendToSeries) {
  let threshold = window.bands.split[band];
  let x = score;
  let model = (score < threshold ? window.bands.low : window.bands.high)[band];
  model = window.bands.all[band];

  let values = [];
  for (let i = 0; i < band; ++i) {
    values.push('-');
  }

  model.forEach((coeff, idx) => {
    values.push(Math.round(coeff[0] + coeff[1] * x));
  });


  appendToSeries.push({
        name: 'prediction for band ' + band,
        type: 'line',
        data: values,
        showSymbol: false,
        lineStyle: {
          width: 1,
          color: '#999',
          opacity: 0.4
        }
  });
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
