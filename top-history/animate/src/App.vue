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
    var myChart = echarts.init(document.getElementById('main'));
    let xAxis = window.story.map(pair => pair[0])
    let trueValue = window.story.map(pair => pair[1])
    let series = [];
    window.story.forEach(pair => {
      makePredictions(pair[0], pair[1], series);
    })
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
        tooltip: {
          trigger: 'axis',
        },
        title: {
            text: 'ECharts entry example'
        },
        xAxis: {
            data: xAxis
        },
        yAxis: {},
        series
    };

    // use configuration item and data specified to show chart
    myChart.setOption(option);
  }
}

function makePredictions(band, score, appendToSeries) {
  let model = window.bands[band];
  if (!model) return;
  let x = score;
  let x_2 = x * x;
  let values = [];
  for (let i = 0; i < band; ++i) {
    values.push('-');
  }

  model.forEach((coeff, idx) => {
    values.push(Math.round(coeff[0] + coeff[1] * x + coeff[2] * x_2));
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
