const forEach = require('./forEach.js');
const inputFileName = process.argv[2] || './athletes.1.js';
const records = [];
const json2csv = require('json2csv');

forEach(inputFileName, (athlete) => {
  let weight = parseWeight(athlete.weight);
  let height = parseHeight(athlete.height);
  let age = athlete.age;
  records.push({
    weight,
    height,
    age,
    name: athlete.name
  });
}).then(() => {
  const csv = json2csv({ data: records });
  console.log(csv);
})

function parseWeight(weight) {
  if (!weight) return;
  let metricWeightMatch = weight.match(/(\d+)\s*kg/);
  if (metricWeightMatch) {
    return Number.parseInt(metricWeightMatch[1], 10);
  }
  let americanWeightMatch = weight.match(/(\d+)\s*lb/);
  if (americanWeightMatch) {
    let weightInPounds = Number.parseInt(americanWeightMatch[1], 10);
    let weightInKilos = Math.round(weightInPounds * 0.453592);
    return weightInKilos;
  }
  throw new Error(weight);
}

function parseHeight(height) {
  if (!height) return;

  let metricHeightMatch = height.match(/(\d+)\s*cm/);
  if (metricHeightMatch) {
    return Number.parseInt(metricHeightMatch[1], 10);
  }
  let feetInchMatch = height.match(/(\d)'(-?\d+)(''|")/);
  if (feetInchMatch) {
    let heightInFeets = Number.parseInt(feetInchMatch[1], 10);
    let heightInInches = Number.parseInt(feetInchMatch[2], 10);
    let heightInCm = heightInFeets * 30.48 + heightInInches * 2.54;
    return Math.round(heightInCm);
  }
  throw new Error(height);
}
