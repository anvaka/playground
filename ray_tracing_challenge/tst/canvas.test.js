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
    console.log(c.toPPM());
  });
});

