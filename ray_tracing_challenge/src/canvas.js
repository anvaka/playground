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

  toPPM() {
    let ppm = `P3\n${this.width} ${this.height}\n255\n`;
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        const pixel = this.pixelAt(x, y);
        const red = Math.round(pixel.red * 255);
        const green = Math.round(pixel.green * 255);
        const blue = Math.round(pixel.blue * 255);
        line += `${red} ${green} ${blue} `;
      }
      ppm += line + '\n';
    }
    return ppm;
  }
}