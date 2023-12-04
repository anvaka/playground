import { Intersection } from '../src/intersection.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';
import { Point, Vector } from '../src/tuple.js';
import { expect } from 'chai';

describe('Intersection', () => {
  it('an intersection encapsulates t and object', () => {
    const s = new Sphere();
    const i = new Intersection(3.5, s);
    expect(i.t).to.equal(3.5);
    expect(i.object).to.equal(s);
  })

  it('aggregating intersections', () => {
    const s = new Sphere();
    const i1 = new Intersection(1, s);
    const i2 = new Intersection(2, s);
    const xs = Intersection.intersections(i1, i2);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(1);
    expect(xs[1].t).to.equal(2);
  });

  it('the hit, when all intersections have positive t', () => {
    const s = new Sphere();
    const i1 = new Intersection(1, s);
    const i2 = new Intersection(2, s);
    const xs = Intersection.intersections(i2, i1);
    const i = Intersection.hit(xs);
    expect(i).to.equal(i1);
  });

  it('the hit, when some intersections have negative t', () => {
    const s = new Sphere();
    const i1 = new Intersection(-1, s);
    const i2 = new Intersection(1, s);
    const xs = Intersection.intersections(i2, i1);
    const i = Intersection.hit(xs);
    expect(i).to.equal(i2);
  });

  it('the hit, when all intersections have negative t', () => {
    const s = new Sphere();
    const i1 = new Intersection(-2, s);
    const i2 = new Intersection(-1, s);
    const xs = Intersection.intersections(i2, i1);
    const i = Intersection.hit(xs);
    expect(i).to.be.null;
  });

  it('the hit is always the lowest nonnegative intersection', () => {
    const s = new Sphere();
    const i1 = new Intersection(5, s);
    const i2 = new Intersection(7, s);
    const i3 = new Intersection(-3, s);
    const i4 = new Intersection(2, s);
    const xs = Intersection.intersections(i1, i2, i3, i4);
    const i = Intersection.hit(xs);
    expect(i).to.equal(i4);
  });
});