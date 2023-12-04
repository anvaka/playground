import mocha from 'mocha';
import { expect } from 'chai';
import { Ray } from '../src/ray.js'
import { Point, Vector } from '../src/tuple.js';
import { translation, scaling } from '../src/transformation.js';
import { Sphere } from '../src/sphere.js';

describe('Ray', () => {
  it('creating and querying a ray', () => {
    const origin = new Point(1, 2, 3);
    const direction = new Vector(4, 5, 6);
    const r = new Ray(origin, direction);
    expect(r.origin.isEqual(origin)).to.be.true;
    expect(r.direction.isEqual(direction)).to.be.true;
  });

  it('computing a point from a distance', () => {
    const r = new Ray(new Point(2, 3, 4), new Vector(1, 0, 0));
    expect(r.position(0).isEqual(new Point(2, 3, 4))).to.be.true;
    expect(r.position(1).isEqual(new Point(3, 3, 4))).to.be.true;
    expect(r.position(-1).isEqual(new Point(1, 3, 4))).to.be.true;
    expect(r.position(2.5).isEqual(new Point(4.5, 3, 4))).to.be.true;
  });

  it('a ray intersects a sphere at two points', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(4);
    expect(xs[1].t).to.equal(6);
  });

  it('a ray intersects a sphere at a tangent', () => {
    const r = new Ray(new Point(0, 1, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(5);
    expect(xs[1].t).to.equal(5);
  });

  it('a ray misses a sphere', () => {
    const r = new Ray(new Point(0, 2, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(0);
  });

  it('a ray originates inside a sphere', () => {
    const r = new Ray(new Point(0, 0, 0), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(-1);
    expect(xs[1].t).to.equal(1);
  });

  it('a sphere is behind a ray', () => {
    const r = new Ray(new Point(0, 0, 5), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(-6);
    expect(xs[1].t).to.equal(-4);
  });

  it('intersect sets the object on the intersection', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].object).to.equal(s);
    expect(xs[1].object).to.equal(s);
  });

  it('translating a ray', () => {
    const r = new Ray(new Point(1, 2, 3), new Vector(0, 1, 0));
    const m = translation(3, 4, 5);
    const r2 = r.transform(m);
    expect(r2.origin.isEqual(new Point(4, 6, 8))).to.be.true;
    expect(r2.direction.isEqual(new Vector(0, 1, 0))).to.be.true;
  });

  it('scaling a ray', () => {
    const r = new Ray(new Point(1, 2, 3), new Vector(0, 1, 0));
    const m = scaling(2, 3, 4);
    const r2 = r.transform(m);
    expect(r2.origin.isEqual(new Point(2, 6, 12))).to.be.true;
    expect(r2.direction.isEqual(new Vector(0, 3, 0))).to.be.true;
  });
});