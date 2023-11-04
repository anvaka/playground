import mocha from 'mocha';
import { expect } from 'chai';
import {Canvas} from '../src/canvas.js'
import { Color } from '../src/color.js';

describe('Canvas', () => {
  it('should be able to create a canvas', () => {
    const c = new Canvas(10, 20);
    expect(c.width).to.equal(10);
    expect(c.height).to.equal(20);
    expect(c.pixels.length).to.equal(10 * 20);
  });

  it('should be able to write pixels to a canvas', () => {
    const c = new Canvas(10, 20);
    const red = new Color(1, 0, 0);
    c.writePixel(2, 3, red);
    expect(c.pixelAt(2, 3).isEqual(red)).to.be.true;
  });

  it('should be able to construct the PPM header', () => {
    const c = new Canvas(5, 3);
    const ppm = c.toPPM();
    const expected = `P3\n5 3\n255\n`;
    expect(ppm.startsWith(expected)).to.be.true;
  });

  it('should be able to construct the PPM pixel data', () => {
    const c = new Canvas(5, 3);
    const c1 = new Color(1.5, 0, 0);
    const c2 = new Color(0, 0.5, 0);
    const c3 = new Color(-0.5, 0, 1);
    c.writePixel(0, 0, c1);
    c.writePixel(2, 1, c2);
    c.writePixel(4, 2, c3);
    const ppm = c.toPPM();
    const expected = `P3\n5 3\n255\n255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 \n` +
      `0 0 0 0 0 0 0 128 0 0 0 0 0 0 0 \n` +
      `0 0 0 0 0 0 0 0 0 0 0 0 0 0 255 \n`;
    expect(ppm).equals(expected);
  });

  it('should be able to split long lines in PPM files', () => {
    const c = new Canvas(10, 2);
    const color = new Color(1, 0.8, 0.6);
    c.fill(color);
    const ppm = c.toPPM();
    // count how many '255 204 153' we met:
    const count = ppm.match(/255 204 153/g).length;
    expect(count).to.equal(20);

    ppm.split('\n').forEach(line => {
      expect(line.length).to.be.lessThan(70);
    });
  });

  it('should end with a newline character', () => {
    const c = new Canvas(5, 3);
    const ppm = c.toPPM();
    expect(ppm.endsWith('\n')).to.be.true;
  });
});

