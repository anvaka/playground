<template>
  <div id="app">
    <h1>Integral sum demo</h1>
    <div class='container'>
      <div class='input side'>
        <h3>Input</h3>
        <div class='input grid'>
          <div v-for='row in rows' class='row'>
            <div v-for='cell in row' class='cell' @mousedown='update(cell, $event)'>
              {{cell.value}}
            </div>
          </div>
        </div>
        <p>
        Click here to increase value. Hold `alt` and click to decrease.
        </p>
      </div>
      <div class='output side'>
        <h3>Output</h3>
        <div class='grid'>
          <div v-for='row in integral' class='row'>
            <div v-for='cell in row' class='cell'>
              {{cell.value}}
            </div>
          </div>
        </div>
        <p>
        This table shows <a href='https://en.wikipedia.org/wiki/Summed_area_table' target='_blank'>Summed area table</a>
        for the table on the left.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',

  methods: {
    update(cell, e) {
      cell.value += e.altKey ? -1 : 1;
      computeIntegral(this.rows, this.integral);
    }
  },

  data () {
    var colsCount = 10;
    var rowsCount = 10;
    var rows = initMatrix(rowsCount, colsCount);
    var integral = initMatrix(rowsCount, colsCount);

    return {
      rows: rows,
      integral: integral,
      msg: 'Welcome to Your Vue.js App'
    }
  }
}

function initMatrix(rowsCount, colsCount) {
  var rows = [];
  for (var y = 0; y < rowsCount; ++y) {
    var row = [];
    rows[y] = row;
    for (var x = 0; x < colsCount; ++x) {
      row.push({
        x: x,
        y: y,
        value: 0
      });
    }
  }

  return rows;
}

function computeIntegral(srcRows, integralRows) {
  for (var y = 0; y < srcRows.length; ++y) {
    var srcRow = srcRows[y];

    for (var x = 0; x < srcRow.length; ++x) {
      var value = srcRow[x].value;

      if (x > 0) {
        value += integralRows[y][x - 1].value;
      }
      if (y > 0) {
        value += integralRows[y - 1][x].value;
      }
      if (x > 0 && y > 0) {
        value -=  integralRows[y - 1][x - 1].value;
      }

      integralRows[y][x].value = value
    }
  }

  return integralRows;
}
</script>

<style scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.container {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.grid {
  display: flex;
  flex-direction: column;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.row {
  display: flex;
  flex-direction: row;
}

.cell {
  width: 18px;
  height: 18px;
  border: 1px solid #999;
  user-select: none; 
}

img {
  width: 200px;
  height: 200px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
