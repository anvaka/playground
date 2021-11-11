import Noise from './my-noise.js'

let cnv = document.querySelector('#scene');
let width = cnv.width = 240;
let height = cnv.height = 240;
let ctx = cnv.getContext('2d');
let p = new Noise();

ctx.fillRect(0, 0, width, height);

let xOffset = 0;
let delta = 100;
requestAnimationFrame(frame);
function frame() {
  requestAnimationFrame(frame);

  let imgData = ctx.getImageData(0, 0, width, height);
  let pixels = imgData.data;

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      let offset = (y * width + x) * 4;
      let xn = x/width;
      let yn = y/height;
      let c = p.get(6*(x + xOffset)/width, 6*(y + xOffset)/height);

      pixels[offset] = Math.round(255*c);
      pixels[offset+1] = Math.round(c * 255);
      pixels[offset+2] = Math.round(c * 255);
    }
  }

  xOffset += 1;
  ctx.putImageData(imgData, 0, 0)
}
