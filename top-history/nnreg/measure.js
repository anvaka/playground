const createPredictor = require('./predictor');
const fs = require('fs');
const path = require('path');
const testSet = require('../test_set.json');

const model = readModel();
const predictor = createPredictor(model);
let sum = 0;
let count = 0;
testSet.forEach(pair => {
  let prediction = predictor.predictScore(pair[0], 3, 30).mean;
  const dx = prediction - pair[1];
  sum += dx * dx;
  count += 1;
})
console.log('rmse: ', Math.sqrt(sum/count))

function readModel() {
  let buffer = fs.readFileSync(path.join(__dirname, '..', 'scores.bin'));

  let model = new Uint32Array(buffer.byteLength/4);
  for (let i = 0; i < model.length; ++i) {
    model[i] = buffer.readUInt32LE(i * 4);
  }
  return model;
}