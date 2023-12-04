import mocha from 'mocha';
import { expect } from 'chai';
import { Sphere } from '../src/sphere.js';
import { translation, scaling } from '../src/transformation.js';
import { Ray } from '../src/ray.js';
import { Point, Vector } from '../src/tuple.js';

describe('Sphere', () => {
  it('a sphere has a default transformation', () => {
    const s = new Sphere();
    expect(s.transform.isIdentity()).to.be.true;
  });

  it('changing a sphere\'s transformation', () => {
    const s = new Sphere();
    const t = translation(2, 3, 4);
    s.transform = t;
    expect(s.transform.isEqual(t)).to.be.true;
  });

  it('intersecting a scaled sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    s.transform = scaling(2, 2, 2);
    const xs = s.intersect(r);
    expect(xs.length).to.equal(2);
    expect(xs[0].t).to.equal(3);
    expect(xs[1].t).to.equal(7);
  });

  it('intersecting a translated sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere();
    s.transform = translation(5, 0, 0);
    const xs = s.intersect(r);
    expect(xs.length).to.equal(0);
  });
});