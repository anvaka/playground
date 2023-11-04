import { Color } from './color.js';

export class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Array(width * height);
    this.pixels.fill(new Color(0, 0, 0));
  }

  writePixel(x, y, color) {
    this.pixels[y * this.width + x] = color;
  }

  pixelAt(x, y) {
    return this.pixels[y * this.width + x];
  }

  fill(color) {
    this.pixels.fill(color);
  }

  toPPM() {
    let ppm = `P3\n${this.width} ${this.height}\n255\n`;
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        const pixel = this.pixelAt(x, y);
        const red = clamp(Math.round(pixel.red * 255), 0, 255);
        const green = clamp(Math.round(pixel.green * 255), 0, 255);
        const blue =  clamp(Math.round(pixel.blue * 255), 0, 255);
        const pixelData = `${red} ${green} ${blue} `;
        if (line.length + pixelData.length > 70) {
          ppm += line + '\n';
          line = '';
        }
        line += pixelData;
      }
      ppm += line + '\n';
    }
    return ppm;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}