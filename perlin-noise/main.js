import Noise from './my-noise.js'

let cnv = document.querySelector('#scene');
let width = cnv.width = 1040;
let height = cnv.height = 1040;
let ctx = cnv.getContext('2d');
let p = new Noise();

ctx.fillRect(0, 0, width, height);

let xOffset = 0;
let delta = 1;
requestAnimationFrame(frame);
function frame() {
  // requestAnimationFrame(frame);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // ctx.clearRect(0, 0, width, height);
  let imgData = ctx.getImageData(0, 0, width, height);
  let pixels = imgData.data;
  let inputColor = [0xf2, 0xea, 0xd7]

  // #F2EAD7
  let lightColor = [0xff, 0xff, 0xff]
  let ambientColor = [0xff, 0xff, 0xff]

  console.time('frame');
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      let offset = (y * width + x) * 4;
      let oct = 100;
      let c = p.get(oct*(x + xOffset)/width, oct * (y + xOffset)/height);
      let c0 = p.get(c, c);
      c0 = p.get(c0/c, c0/c);
      c0 = p.get(c0/c, c0/c);
      let pixelColor = applyLight(inputColor,
        x/width, y/height,
        c0, c0, 1,
        0.5, 0.5, 8, 
        lightColor, ambientColor);
      c = Math.round(c0 * 255);
      // pixelColor[0] = c; pixelColor[1] = c; pixelColor[2] = c;
      pixels[offset + 0] = pixelColor[0];
      pixels[offset + 1] = pixelColor[1];
      pixels[offset + 2] = pixelColor[2];
    }
  }

  // xOffset += 5;
  delta += 1;
  console.timeEnd('frame');
  ctx.putImageData(imgData, 0, 0)
}

function applyLight(inputColor, 
  pointX, pointY, 
  pointNormalX, pointNormalY, pointNormalZ,
  lightX, lightY, lightZ,
  lightColor, ambientColor) {

  let normal = Math.sqrt(pointNormalX * pointNormalX + pointNormalY * pointNormalY + pointNormalZ * pointNormalZ);
  let normalX = pointNormalX / normal;
  let normalY = pointNormalY / normal;
  let normalZ = pointNormalZ / normal;
  
  let lightDirX = lightX - pointX;
  let lightDirY = lightY - pointY;
  let lightDirZ = lightZ;
  let lightDirLength = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
  lightDirX /= lightDirLength;
  lightDirY /= lightDirLength;
  lightDirZ /= lightDirLength;

  let dot = normalX * lightDirX + normalY * lightDirY + normalZ * lightDirZ;
  let diffuse = Math.max(0, dot);
  let lightIntensity = ambientColor.map((x, i) => (x + lightColor[i] * diffuse)/255);

  return inputColor.map((x, i) => Math.round(x * lightIntensity[i]/2));
}