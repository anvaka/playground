import mocha from 'mocha';
import { expect } from 'chai';
import {Color} from '../src/color.js'

describe('colors', () => {
  it('should be able to create a color', () => {
    const c = new Color(-0.5, 0.4, 1.7);
    expect(c.red).to.equal(-0.5);
    expect(c.green).to.equal(0.4);
    expect(c.blue).to.equal(1.7);
  });
  
  it('should be able to add two colors', () => {
    const c1 = new Color(0.9, 0.6, 0.75);
    const c2 = new Color(0.7, 0.1, 0.25);
    const expected = new Color(1.6, 0.7, 1.0);
    expect(c1.add(c2).isEqual(expected)).to.be.true;
  });
});