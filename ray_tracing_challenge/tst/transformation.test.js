import mocha from 'mocha';
import {expect} from 'chai';
import {translation, scaling, rotationX, rotationY, rotationZ, shearing} from '../src/transformation.js'
import {Point, Vector} from '../src/tuple.js'

describe('transformation', () => {
  it('multiply by a translation matrix', () => {
    const transform = translation(5, -3, 2);
    const p = new Point(-3, 4, 5);
    expect(transform.multiply(p)).to.deep.equal(new Point(2, 1, 7));
  });

  it('multiply by the inverse of a translation matrix', () => {
    const transform = translation(5, -3, 2);
    const inv = transform.inverse();
    const p = new Point(-3, 4, 5);
    expect(inv.multiply(p)).to.deep.equal(new Point(-8, 7, 3));
  });

  it('translation does not affect vectors', () => {
    const transform = translation(5, -3, 2);
    const v = new Vector(-3, 4, 5);
    expect(transform.multiply(v)).to.deep.equal(v);
  });

  it('a scaling matrix applied to a point', () => {
    const transform = scaling(2, 3, 4);
    const p = new Point(-4, 6, 8);
    expect(transform.multiply(p)).to.deep.equal(new Point(-8, 18, 32));
  });

  it('a scaling matrix applied to a vector', () => {
    const transform = scaling(2, 3, 4);
    const v = new Vector(-4, 6, 8);
    expect(transform.multiply(v)).to.deep.equal(new Vector(-8, 18, 32));
  });
  
  it('multiply by the inverse of a scaling matrix', () => {
    const transform = scaling(2, 3, 4);
    const inv = transform.inverse();
    const v = new Vector(-4, 6, 8);
    expect(inv.multiply(v)).to.deep.equal(new Vector(-2, 2, 2));
  });

  it('reflection is scaling by a negative value', () => {
    const transform = scaling(-1, 1, 1);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p)).to.deep.equal(new Point(-2, 3, 4));
  });

  it('rotate a point around the x axis', () => {
    const p = new Point(0, 1, 0);
    const halfQuarter = rotationX(Math.PI / 4);
    const fullQuarter = rotationX(Math.PI / 2);
    const full = rotationX(Math.PI);
    expect(halfQuarter.multiply(p).isEqual(new Point(0, Math.sqrt(2) / 2, Math.sqrt(2) / 2))).to.be.true;
    expect(fullQuarter.multiply(p).isEqual(new Point(0, 0, 1))).to.be.true;
    expect(full.multiply(p).isEqual(new Point(0, -1, 0))).to.be.true;
  });

  it('inverse of an x-rotation rotates in the opposite direction', () => {
    const p = new Point(0, 1, 0);
    const halfQuarter = rotationX(Math.PI / 4);
    const inv = halfQuarter.inverse();
    expect(inv.multiply(p).isEqual(new Point(0, Math.sqrt(2) / 2, -Math.sqrt(2) / 2))).to.be.true;
  });

  it('rotate a point around the y axis', () => {
    const p = new Point(0, 0, 1);
    const halfQuarter = rotationY(Math.PI / 4);
    const fullQuarter = rotationY(Math.PI / 2);
    expect(halfQuarter.multiply(p).isEqual(new Point(Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2))).to.be.true;
    expect(fullQuarter.multiply(p).isEqual(new Point(1, 0, 0))).to.be.true;
  });

  it('rotate a point around the z axis', () => {
    const p = new Point(0, 1, 0);
    const halfQuarter = rotationZ(Math.PI / 4);
    const fullQuarter = rotationZ(Math.PI / 2);
    expect(halfQuarter.multiply(p).isEqual(new Point(-Math.sqrt(2) / 2, Math.sqrt(2) / 2, 0))).to.be.true;
    expect(fullQuarter.multiply(p).isEqual(new Point(-1, 0, 0))).to.be.true;
  });

  it('shearing transformation moves x in proportion to y', () => {
    const transform = shearing(1, 0, 0, 0, 0, 0);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(5, 3, 4))).to.be.true;
  });

  it('shearing transformation moves x in proportion to z', () => {
    const transform = shearing(0, 1, 0, 0, 0, 0);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(6, 3, 4))).to.be.true;
  });

  it('shearing transformation moves y in proportion to x', () => {
    const transform = shearing(0, 0, 1, 0, 0, 0);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(2, 5, 4))).to.be.true;
  });

  it('shearing transformation moves y in proportion to z', () => {
    const transform = shearing(0, 0, 0, 1, 0, 0);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(2, 7, 4))).to.be.true;
  });

  it('shearing transformation moves z in proportion to x', () => {
    const transform = shearing(0, 0, 0, 0, 1, 0);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(2, 3, 6))).to.be.true;
  });

  it('shearing transformation moves z in proportion to y', () => {
    const transform = shearing(0, 0, 0, 0, 0, 1);
    const p = new Point(2, 3, 4);
    expect(transform.multiply(p).isEqual(new Point(2, 3, 7))).to.be.true;
  });

  it('individual transformations are applied in sequence', () => {
    const p = new Point(1, 0, 1);
    const a = rotationX(Math.PI / 2);
    const b = scaling(5, 5, 5);
    const c = translation(10, 5, 7);
    const p2 = a.multiply(p);
    expect(p2.isEqual(new Point(1, -1, 0))).to.be.true;
    const p3 = b.multiply(p2);
    expect(p3.isEqual(new Point(5, -5, 0))).to.be.true;
    const p4 = c.multiply(p3);
    expect(p4.isEqual(new Point(15, 0, 7))).to.be.true;
  });

  it('chained transformations must be applied in reverse order', () => {
    const p = new Point(1, 0, 1);
    const a = rotationX(Math.PI / 2);
    const b = scaling(5, 5, 5);
    const c = translation(10, 5, 7);
    const t = c.multiply(b).multiply(a);
    expect(t.multiply(p).isEqual(new Point(15, 0, 7))).to.be.true;
  });
});