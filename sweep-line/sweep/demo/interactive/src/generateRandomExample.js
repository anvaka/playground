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
      {min: 10, max: 50},  // number of rects
      {min: 3, max: 200},  // segments
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