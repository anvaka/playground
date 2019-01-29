let form = document.querySelector('#phrase-form');
let input = document.querySelector('#input-text');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  fetch(`/vectors?text=${encodeURIComponent(input.value)}`)
    .then(res => res.json())
    .then(visualize)
    .then(transformValues)
    .then(vector => postData('/nn', { vector }))
    .then(res => {
      console.log(
        res.nearest
          .map(x => {
            return x.word + ' ' + x.distance.toFixed(2);
          })
          .join('\n')
      );
    });
});

function visualize(records) {
  if (!records) return records;
  records = records.filter(x => x.vector);
  if (!records.length) return records;

  var gradient = makeGradient([
    { stop: 0.0, r: 0x28, g: 0x28, b: 0x28 },
    { stop: 0.5, r: 0x6a, g: 0xa8, b: 0xc6 },
    { stop: 1.0, r: 0xe2, g: 0xe5, b: 0xaa }
  ]);

  let dimensions = records[0].vector.length;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  records.forEach(record => {
    record.vector.forEach(v => {
      if (v < min) min = v;
      if (v > max) max = v;
    });
  });
//   min = -3.0639;
//   max = 3.2582;
// min = -57.307;
// max = 7.8814;

  var canvas = document.querySelector('#out');
  var ctx = canvas.getContext('2d');
  var width = dimensions * 30;
  var height = 480;
  ctx.width = canvas.width = width;
  ctx.height = canvas.height = height;

  let textWidth = 100;
  let rowHeight = 30;
  ctx.fillRect(0, 0, width, height);

  let rowWidth = width - textWidth;
  let cellWidth = rowWidth / dimensions;

  records.forEach((record, idx) => {
    let text = record.word;
    let y = rowHeight * idx;
    ctx.fillStyle = 'deepskyblue';
    ctx.fillText(text, 10, y + rowHeight / 2 + 10, textWidth - 10);
    record.vector.forEach((v, idx) => {
      let x = textWidth + (rowWidth * idx) / record.vector.length;
      var { r, g, b } = gradient((v - min) / (max - min));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, cellWidth, rowHeight);
    });
  });

  return records;

  function makeGradient(stops) {
    return getColor;

    function getColor(t) {
      if (t <= 0) return stops[0];
      if (t >= 1) return stops[stops.length - 1];

      var from = stops[0];

      // the array of stops is small. No need to be fancy - plain iteration is good enough
      for (var i = 1; i < stops.length; ++i) {
        var to = stops[i];
        if (from.stop <= t && t < to.stop) {
          // how far are we between these two stops?
          var dist = (t - from.stop) / (to.stop - from.stop);
          return mix(to, from, dist);
        } else {
          // Keep looking
          from = to;
        }
      }

      throw new Error('This should not be possible!');
    }

    // linear interpolation between r, g, and b components of a color
    function mix(a, b, t) {
      return {
        r: Math.round(a.r * t + (1 - t) * b.r),
        g: Math.round(a.g * t + (1 - t) * b.g),
        b: Math.round(a.b * t + (1 - t) * b.b)
      };
    }
  }
}

function transformValues(records) {
  if (!records) return;
  records = records.filter(x => x.vector);
  if (!records.length) return;

  let result = [];
  let count = 0;
  let dimensions = records[0].vector.length;
  for (var i = 0; i < dimensions; ++i) result[i] = 0;

  records.forEach(record => {
    record.vector.forEach((v, idx) => {
      result[idx] += v;
    });
    count += 1;
  });

  return result.map(v => v / count);
}

function postData(url = ``, data = {}) {
  // Default options are marked with *
  return fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // "Content-Type": "application/x-www-form-urlencoded",
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }).then(response => response.json()); // parses response to JSON
}
