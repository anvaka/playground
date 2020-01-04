import themes from './themes';

export function createColorRampCanvas(theme) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const width = 256;
  const height = 1;
  context.width = canvas.width = width;
  context.height = canvas.height = height;

  let colors = getColors(width, getColorRampSteps(theme))
  drawColors(colors, context, height);
  return canvas;
}

export function createColorRampArray(theme) {
  return getColors(256, getColorRampSteps(theme)).map(toInt);
}

function drawColors(colors, ctx, height) {
  colors.forEach((color, x) => {
    ctx.fillStyle = toHexColor(color);
    ctx.fillRect(x, 0, 1, height);
  })
}

function getColors(width, steps) {
  let sum = steps.reduce((prev, current) => {
    return prev + (current.size || 0)
  }, 0);
  let colors = [];

  for (let i = 1; i < steps.length; ++i) {
    let sliceWidth = Math.ceil(width * steps[i - 1].size  / sum);
    let fromColor = parseColor(steps[i - 1].value);
    let toColor = parseColor(steps[i].value);
    for (let x = 0; x < sliceWidth; ++x) {
      let color = lerp(fromColor, toColor, x/sliceWidth);
      colors.push(color);
    }
  }

  return colors;
  
  function parseColor(hex) {
    return {
      r: Number.parseInt(hex.substr(1, 2), 16),
      g: Number.parseInt(hex.substr(3, 2), 16),
      b: Number.parseInt(hex.substr(5, 2), 16),    
    } 
  }
  
  function lerp(from, to, scale) {
    return {
      r: from.r * (1 - scale) + to.r * scale,
      g: from.g * (1 - scale) + to.g * scale,
      b: from.b * (1 - scale) + to.b * scale,
      a: 255
    }
  }
}

function toHexColor(rgb) {
  return '#' + hexNum(rgb.r) + hexNum(rgb.g) + hexNum(rgb.b);
}

function toInt(color) {
  let a = color.a === undefined ? 0xFF : color.a;
  return (color.r << 24) | (color.g << 16) |  (color.b << 8) | a;
}

export function toHexColorFromInt(intValue) {
  return '#' + hexNum((intValue >> 24) & 0xFF) + 
    hexNum((intValue >> 16) & 0xFF) +
    hexNum((intValue >> 8) & 0xFF);
    // hexNum((intValue >> 0) & 0xFF)
}

function hexNum(x) {
  x = Math.round(x);
  let prefix = x < 16 ? '0' : '';
  return prefix + x.toString(16);
}

function getColorRampSteps(currentTheme) {
    return (themes[currentTheme] || themes.EARTH).colorRamp;
}