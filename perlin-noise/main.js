import Noise from './my-noise.js'

let cnv = document.querySelector('#scene');
let width = cnv.width = 240;
let height = cnv.height = 240;
let ctx = cnv.getContext('2d');
let p = new Noise();

ctx.fillRect(0, 0, width, height);

let xOffset = 0;
let delta = 0;
requestAnimationFrame(frame);
function frame() {
  requestAnimationFrame(frame);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // ctx.clearRect(0, 0, width, height);
  let imgData = ctx.getImageData(0, 0, width, height);
  let pixels = imgData.data;
  let inputColor = [0xf2, 0xea, 0xd7]

  // #F2EAD7
  let lightColor = [0xff, 0xff, 0xff]
  let ambientColor = [0, 0, 0];

  console.time('frame');
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      let oct = 10;
      let c = p.get(oct*(x + xOffset)/width, oct * (y + xOffset)/height);
      let c0 = p.get(c, c);
      c0 = p.get(c0/c, c0/c);
      c0 = p.get(c0/c, c0/c);
      c = c0;
      let lightPos = [(Math.cos(delta) + 1)/2, (Math.sin(delta) + 1) / 2, 0.2];
      let point = [x/width, y/height, 0];
      let pointNormal = normalize([0, c, 1]);
      let lightDirection = normalize(lightPos.map((x, i) => x - point[i]));

      let lightIntensity = getLight(lightDirection, pointNormal); 
      let pixelColor = getFinalColor(lightIntensity, ambientColor, lightColor, inputColor);
      // c = Math.round(c0 * 255);
      // pixelColor[0] = c; pixelColor[1] = c; pixelColor[2] = c;
      let offset = (y * width + x) * 4;
      
      pixels[offset + 0] = pixelColor[0];
      pixels[offset + 1] = pixelColor[1];
      pixels[offset + 2] = pixelColor[2];
    }
  }

  // xOffset += 5;
  delta += 0.1;
  console.log(delta)
  console.timeEnd('frame');
  ctx.putImageData(imgData, 0, 0)
}

function getLight(lightDirection, normal) {
  let lightDotNormal = dot(lightDirection, normal);
  let diffuse = Math.max(0, lightDotNormal);
  return diffuse;
}

function getFinalColor(lightIntensity, ambientColor, lightColor, pointColor){
  let r, g, b;
  r = pointColor[0] * (ambientColor[0] + lightColor[0] * lightIntensity)/255;
  g = pointColor[1] * (ambientColor[1] + lightColor[1] * lightIntensity)/255;
  b = pointColor[2] * (ambientColor[2] + lightColor[2] * lightIntensity)/255;
  return [r, g, b];
}

function phongSpecular(lightDirection, viewDirection, normal, shininess) {
  let r = reflect(lightDirection, normal).map(x => -x);
  let rDotV = dot(r, viewDirection);  
  return Math.pow(Math.max(0, rDotV), shininess);
}

function blinnPhongSpecular(lightDirection, viewDirection, normal, shininess) {
  let H = normalize(viewDirection.map((x, i) => lightDirection[i] + x)).map(x => -x)
  let sDotH = dot(normal, H);
  return Math.pow(Math.max(0, sDotH), shininess);
}

function reflect(vector, surfaceNormal) {
  let dot = vector.map((x, i) => x * surfaceNormal[i]);
  let r = vector.map((x, i) => x - 2 * dot[i] * surfaceNormal[i]);
  return r;
}
function normalize(vector) {
  let length = Math.sqrt(vector.map((x, i) => x * x).reduce((a, b) => a + b));
  return vector.map((x, i) => x / length);
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; ++i) {
    sum += a[i] * b[i];
  }
  return sum;
}