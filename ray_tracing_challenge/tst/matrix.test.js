import mocha from 'mocha';
import {expect} from 'chai';
import {Matrix} from '../src/matrix.js'

describe('matrix', () => {
  it('should be able to create a matrix', () => {
    const m = new Matrix(4, 4);
    m.set(0, 0, 1)
    m.set(0, 3, 4)
    m.set(1, 0, 5.5)
    m.set(1, 2, 7.5)
    m.set(2, 2, 11)
    m.set(3, 0, 13)
    m.set(3, 2, 15)

    expect(m.rows).to.equal(4);
    expect(m.columns).to.equal(4);

    expect(m.get(0, 0)).to.equal(1);
    expect(m.get(0, 3)).to.equal(4);
    expect(m.get(1, 0)).to.equal(5.5);
    expect(m.get(1, 2)).to.equal(7.5);
    expect(m.get(2, 2)).to.equal(11);
    expect(m.get(3, 0)).to.equal(13);
    expect(m.get(3, 2)).to.equal(15);
  });

  it('should be able to create a 2x2 matrix', () => {
    const m = new Matrix(2, 2);
    m.set(0, 0, -3);
    m.set(0, 1, 5);
    m.set(1, 0, 1);
    m.set(1, 1, -2);

    expect(m.get(0, 0)).to.equal(-3);
    expect(m.get(0, 1)).to.equal(5);
    expect(m.get(1, 0)).to.equal(1);
    expect(m.get(1, 1)).to.equal(-2);
  });

  it('should be able to create a 3x3 matrix', () => {
    const m = new Matrix(3, 3);
    m.set(0, 0, -3);
    m.set(0, 1, 5);
    m.set(0, 2, 0);
    m.set(1, 0, 1);
    m.set(1, 1, -2);
    m.set(1, 2, -7);
    m.set(2, 0, 0);
    m.set(2, 1, 1);
    m.set(2, 2, 1);

    expect(m.get(0, 0)).to.equal(-3);
    expect(m.get(1, 1)).to.equal(-2);
    expect(m.get(2, 2)).to.equal(1);
  });

  it('should be able to compare two identical matrices', () => {
    const m1 = new Matrix(4, 4, [
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 8, 7, 6,
      5, 4, 3, 2
    ]);

    const m2 = new Matrix(4, 4, [
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 8, 7, 6,
      5, 4, 3, 2
    ]);

    expect(m1.isEqual(m2)).to.be.true;
    expect(m2.get(0, 0)).to.equal(1);
  });

  it('should be able to compare two different matrices', () => {
    const m1 = new Matrix(4, 4);
    m1.set(0, 0, 1)
    m1.set(0, 3, 4)

    const m2 = new Matrix(4, 4);
    m2.set(0, 0, 1)
    m2.set(0, 3, 5)
    expect(m1.isEqual(m2)).to.be.false;
  });
});