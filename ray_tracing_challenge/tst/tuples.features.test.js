import mocha from 'mocha';
import { expect } from 'chai';
import {Tuple, Point, Vector} from '../src/tuple.js'

describe('Tuples', () => {
  it('should be able to create a tuple', () => {
    const a = new Tuple(4.3, -4.2, 3.1, 1.0);
    expect(a.x).to.equal(4.3);
    expect(a.y).to.equal(-4.2);
    expect(a.z).to.equal(3.1);
    expect(a.w).to.equal(1.0);
    expect(a.isPoint()).to.be.true;
    expect(a.isVector()).to.be.false;
  });

  it('should be able to create a vector', () => {
    const a = new Tuple(4.3, -4.2, 3.1, 0.0);
    expect(a.x).to.equal(4.3);
    expect(a.y).to.equal(-4.2);
    expect(a.z).to.equal(3.1);
    expect(a.w).to.equal(0.0);
    expect(a.isPoint()).to.be.false;
    expect(a.isVector()).to.be.true;
  });

  it('should be able to create a point', () => {
    const a = new Point(4, -4, 3);
    expect(a.x).to.equal(4);
    expect(a.y).to.equal(-4);
    expect(a.z).to.equal(3);
    expect(a.w).to.equal(1);
    expect(a.isPoint()).to.be.true;
    expect(a.isVector()).to.be.false;
  })

  it('should be able to create a vector', () => {
    const a = new Vector(4, -4, 3);
    expect(a.x).to.equal(4);
    expect(a.y).to.equal(-4);
    expect(a.z).to.equal(3);
    expect(a.w).to.equal(0);
    expect(a.isPoint()).to.be.false;
    expect(a.isVector()).to.be.true;
  });

  it('should be able to strict compare two tuples', () => {
    const a = new Tuple(4.3, -4.2, 3.1, 1.0);
    const b = new Tuple(4.3, -4.2, 3.1, 1.0);
    expect(a.isStrictEqual(b)).to.be.true;
    expect(a.isEqual(b)).to.be.true;
  });

  it('should be able to compare two tuples', () => {
    const a = new Tuple(4.3, -4.2, 3.1, 1.0);
    const b = new Tuple(4.3, -4.2 + 1e-5, 3.1, 1.0);

    expect(a.isStrictEqual(b)).to.be.false;
    expect(a.isEqual(b)).to.be.true;
  });

  it('should be able to subtract two points', () => {
    const p1 = new Point(3, 2, 1);
    const p2 = new Point(5, 6, 7);
    const result = p1.subtract(p2);
    expect(result.isEqual(new Vector(-2, -4, -6))).to.be.true;
  });

  it('can subtract vector from a point', () => {
    const p = new Point(3, 2, 1);
    const v = new Vector(5, 6, 7);
    const result = p.subtract(v);
    expect(result.isEqual(new Point(-2, -4, -6))).to.be.true;
  });

  it('can subtract two vectors', () => {
    const v1 = new Vector(3, 2, 1);
    const v2 = new Vector(5, 6, 7);
    const result = v1.subtract(v2);
    expect(result.isEqual(new Vector(-2, -4, -6))).to.be.true;
  });

  it('can subtract a vector from the zero vector', () => {
    const zero = new Vector(0, 0, 0);
    const v = new Vector(1, -2, 3);
    const result = zero.subtract(v);
    expect(result.isEqual(new Vector(-1, 2, -3))).to.be.true;
  });

  it('can negate a tuple', () => {
    const a = new Tuple(1, -2, 3, -4);
    const result = a.negate();
    expect(result.isEqual(new Tuple(-1, 2, -3, 4))).to.be.true;
  });

  it('can multiply a tuple by a scalar', () => {
    const a = new Tuple(1, -2, 3, -4);
    const result = a.multiply(3.5);
    expect(result.isEqual(new Tuple(3.5, -7, 10.5, -14))).to.be.true;
  });

  it('can multiply a tuple by a fraction', () => {
    const a = new Tuple(1, -2, 3, -4);
    const result = a.multiply(0.5);
    expect(result.isEqual(new Tuple(0.5, -1, 1.5, -2))).to.be.true;
  });

  it('can divide a tuple by a scalar', () => {
    const a = new Tuple(1, -2, 3, -4);
    const result = a.divide(2);
    expect(result.isEqual(new Tuple(0.5, -1, 1.5, -2))).to.be.true;
  });

  it('can compute the magnitude of vector(1, 0, 0)', () => {
    const v = new Vector(1, 0, 0);
    expect(v.magnitude()).to.equal(1);
  });

  it('can compute the magnitude of vector(0, 1, 0)', () => {
    const v = new Vector(0, 1, 0);
    expect(v.magnitude()).to.equal(1);
  });

  it('can compute the magnitude of vector(0, 0, 1)', () => {
    const v = new Vector(0, 0, 1);
    expect(v.magnitude()).to.equal(1);
  });

  it('can compute the magnitude of vector(1, 2, 3)', () => {
    const v = new Vector(1, 2, 3);
    expect(v.magnitude()).to.equal(Math.sqrt(14));
  });

  it('can compute the magnitude of vector(-1, -2, -3)', () => {
    const v = new Vector(-1, -2, -3);
    expect(v.magnitude()).to.equal(Math.sqrt(14));
  });

  it('can normalize vector(4, 0, 0)', () => {
    const v = new Vector(4, 0, 0);
    const result = v.normalize();
    expect(result.isEqual(new Vector(1, 0, 0))).to.be.true;
  });

  it('can normalize vector(1, 2, 3)', () => {
    const v = new Vector(1, 2, 3);
    const result = v.normalize();
    expect(result.isEqual(new Vector(0.26726, 0.53452, 0.80178))).to.be.true;
  });

  it('can normalize vector(1, 2, 3)', () => {
    const v = new Vector(1, 2, 3);
    const result = v.normalize();
    expect(result.magnitude()).to.equal(1);
  });

  it('can compute the dot product of two tuples', () => {
    const a = new Vector(1, 2, 3);
    const b = new Vector(2, 3, 4);
    expect(a.dot(b)).to.equal(20);
  });

  it('can compute the cross product of two vectors', () => {
    const a = new Vector(1, 2, 3);
    const b = new Vector(2, 3, 4);
    expect(a.cross(b).isEqual(new Vector(-1, 2, -1))).to.be.true;
    expect(b.cross(a).isEqual(new Vector(1, -2, 1))).to.be.true;
  });
});