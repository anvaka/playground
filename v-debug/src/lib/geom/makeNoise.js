const random = require('ngraph.random').random(42)

export default function makeNoise(x0, y0, x1, y1, v, n, out) {
  let start = {
    x: x0,
    y: y0
  }
  let end = {
    x: x1,
    y: y1
  }

  let dx = x1 - x0
  let dy = y1 - y0
  let l = Math.sqrt(dx * dx + dy * dy)

  var variance = l * 0.5
  var xmid = 0.5 * (x0 + x1) + gaussian(0, Math.sqrt(variance));
  var ymid = 0.5 * (y0 + y1) + gaussian(0, Math.sqrt(variance));

  if (n > 1 && l > 15) {
    makeNoise(x0, y0, xmid, ymid, v/2, n - 1, out)
    makeNoise(xmid, ymid, x1, y1, v/2, n - 1, out)
  } else {
    out.push(start, {
      x: xmid,
      y: ymid
    }, end)
  }
}

function uniform(min, max) {
  return random.nextDouble()* (max - min) + min;
}

function gaussian(mu, sigma) {
    // use the polar form of the Box-Muller transform
    let r, x, y;
    do {
        x = uniform(-1.0, 1.0);
        y = uniform(-1.0, 1.0);
        r = x*x + y*y;
    } while (r >= 1 || r === 0);
    return mu + sigma * x * Math.sqrt(-2 * Math.log(r) / r);

    // Remark:  y * Math.sqrt(-2 * Math.log(r) / r)
    // is an independent random gaussian
}