var params = [
  {
    name: 'random',
    args: [
      {min: 100, max: 500},  // number of lines
      {min: 100, max: 200},  // visible area
    ]
  },
  {
    name: 'complete',
    args: [
      {min: 10, max: 40},  // number of nodes
      {min: 400, max: 600},  // visible area
    ]
  },
  {
    name: 'cube',
    args: [
      {min: 100, max: 150},  // number of rects
      {min: 3, max: 10},  // variance
    ]
  },
  {
    name: 'drunkgrid',
    args: [
      {min: 10, max: 150},  // Row x Col
      {min: 0.1, max: 10},  // variance
    ]
  },
  {
    name: 'triangle',
    args: [
      {min: 100, max: 500},  // Count  
      {min: 10, max: 20},  // variance
    ]
  }
]

export default function generateRandomExample() {
  var generatorIdx = Math.round(Math.random() * (params.length - 1));
  var generator = params[generatorIdx];

  var qs = {
    generator: generator.name
  }
  generator.args.forEach((range, idx) => {
    qs[`p${idx}`] = Math.round(Math.random() * (range.max - range.min) + range.min);
  });

  return qs;
}