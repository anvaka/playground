import mocha from 'mocha';
import {expect} from 'chai';
import {Matrix} from '../src/matrix.js'
import {Tuple} from '../src/tuple.js'

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

  it('should be able to multiply two matrices', () => {
    const m1 = new Matrix(4, 4, [
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 8, 7, 6,
      5, 4, 3, 2
    ]);

    const m2 = new Matrix(4, 4, [
      -2, 1, 2, 3,
      3, 2, 1, -1,
      4, 3, 6, 5,
      1, 2, 7, 8
    ]);

    const result = m1.multiply(m2);
    const expected = new Matrix(4, 4, [
      20, 22, 50, 48,
      44, 54, 114, 108,
      40, 58, 110, 102,
      16, 26, 46, 42
    ]);

    expect(result.isEqual(expected)).to.be.true;
  });

  it('should be able to multiply a matrix by a tuple', () => {
    const m = new Matrix(4, 4, [
      1, 2, 3, 4,
      2, 4, 4, 2,
      8, 6, 4, 1,
      0, 0, 0, 1
    ]);

    const t = new Tuple(1, 2, 3, 1);
    const result = m.multiply(t);
    const expected = new Tuple(18, 24, 33, 1);

    expect(result.isEqual(expected)).to.be.true;
  });

  it('should be able to multiply a matrix by the identity matrix', () => {
    const m = new Matrix(4, 4, [
      0, 1, 2, 4,
      1, 2, 4, 8,
      2, 4, 8, 16,
      4, 8, 16, 32
    ]);

    const result = m.multiply(Matrix.identity(4));
    expect(result.isEqual(m)).to.be.true;
  });

  it('should be able to multiply the identity matrix by a tuple', () => {
    const t = new Tuple(1, 2, 3, 4);
    const result = Matrix.identity(4).multiply(t);
    expect(result.isEqual(t)).to.be.true;
  });

  it('should be able to transpose a matrix', () => {
    const m = new Matrix(4, 4, [
      0, 9, 3, 0,
      9, 8, 0, 8,
      1, 8, 5, 3,
      0, 0, 5, 8
    ]);

    const result = m.transpose();
    const expected = new Matrix(4, 4, [
      0, 9, 1, 0,
      9, 8, 8, 0,
      3, 0, 5, 5,
      0, 8, 3, 8
    ]);
    expect(result.isEqual(expected)).to.be.true;
  });

  it('should be able to transpose the identity matrix', () => {
    const result = Matrix.identity(4).transpose();
    expect(result.isEqual(Matrix.identity(4))).to.be.true;
  });

  it('should be able to calculate the determinant of a 2x2 matrix', () => {
    const m = new Matrix(2, 2, [
      1, 5,
      -3, 2
    ]);

    expect(m.determinant()).to.equal(17);
  });

  it('submatrix of 3x3 matrix is a 2x2 matrix', () => {
    const m = new Matrix(3, 3, [
      1, 5, 0,
      -3, 2, 7,
      0, 6, -3
    ]);

    const result = m.submatrix(0, 2);
    const expected = new Matrix(2, 2, [
      -3, 2,
      0, 6
    ]);
  });

  it('a submatrix of a 4x4 matrix is a 3x3 matrix', () => {
    const m = new Matrix(4, 4, [
      -6, 1, 1, 6,
      -8, 5, 8, 6,
      -1, 0, 8, 2,
      -7, 1, -1, 1
    ]);

    const result = m.submatrix(2, 1);
    const expected = new Matrix(3, 3, [
      -6, 1, 6,
      -8, 8, 6,
      -7, -1, 1
    ]);

    expect(result.isEqual(expected)).to.be.true;
  });

  it('can calculate the minor of a 3x3 matrix', () => {
    const m = new Matrix(3, 3, [
      3, 5, 0,
      2, -1, -7,
      6, -1, 5
    ]);

    const submatrix = m.submatrix(1, 0);
    expect(submatrix.determinant()).to.equal(25);
    expect(m.minor(1, 0)).to.equal(25);
  });

  it('can calculate the cofactor of a 3x3 matrix', () => {
    const m = new Matrix(3, 3, [
      3, 5, 0,
      2, -1, -7,
      6, -1, 5
    ]);

    expect(m.minor(0, 0)).to.equal(-12);
    expect(m.cofactor(0, 0)).to.equal(-12);
    expect(m.minor(1, 0)).to.equal(25);
    expect(m.cofactor(1, 0)).to.equal(-25);
  });

  it('can calculate the determinant of a 3x3 matrix', () => {
    const m = new Matrix(3, 3, [
      1, 2, 6,
      -5, 8, -4,
      2, 6, 4
    ]);

    expect(m.cofactor(0, 0)).to.equal(56);
    expect(m.cofactor(0, 1)).to.equal(12);
    expect(m.cofactor(0, 2)).to.equal(-46);
    expect(m.determinant()).to.equal(-196);
  });

  it('can calculate the determinant of a 4x4 matrix', () => {
    const m = new Matrix(4, 4, [
      -2, -8, 3, 5,
      -3, 1, 7, 3,
      1, 2, -9, 6,
      -6, 7, 7, -9
    ]);

    expect(m.cofactor(0, 0)).to.equal(690);
    expect(m.cofactor(0, 1)).to.equal(447);
    expect(m.cofactor(0, 2)).to.equal(210);
    expect(m.cofactor(0, 3)).to.equal(51);
    expect(m.determinant()).to.equal(-4071);
  });

  it('should be able to determine if a matrix is invertible', () => {
    const m = new Matrix(4, 4, [
      6, 4, 4, 4,
      5, 5, 7, 6,
      4, -9, 3, -7,
      9, 1, 7, -6
    ]);

    expect(m.determinant()).to.equal(-2120);
    expect(m.isInvertible()).to.be.true;
  });

  it('should be able to determine if a matrix is not invertible', () => {
    const m = new Matrix(4, 4, [
      -4, 2, -2, -3,
      9, 6, 2, 6,
      0, -5, 1, -5,
      0, 0, 0, 0
    ]);

    expect(m.determinant()).to.equal(0);
    expect(m.isInvertible()).to.be.false;
  });

  it('should be able to calculate the inverse of a matrix', () => {
    const m = new Matrix(4, 4, [
      -5, 2, 6, -8,
      1, -5, 1, 8,
      7, 7, -6, -7,
      1, -3, 7, 4
    ]);

    const inverse = m.inverse();
    expect(m.determinant()).to.equal(532);
    expect(m.cofactor(2, 3)).to.equal(-160);
    expect(inverse.get(3, 2)).to.equal(-160 / 532);
    expect(m.cofactor(3, 2)).to.equal(105);
    expect(inverse.get(2, 3)).to.equal(105 / 532);

    const expected = new Matrix(4, 4, [
      0.21805, 0.45113, 0.24060, -0.04511,
      -0.80827, -1.45677, -0.44361, 0.52068,
      -0.07895, -0.22368, -0.05263, 0.19737,
      -0.52256, -0.81391, -0.30075, 0.30639
    ]);
    expect(inverse.isEqual(expected)).to.be.true;
  });

  it('should be able to calculate the inverse of another matrix', () => {
    const m = new Matrix(4, 4, [
      8, -5, 9, 2,
      7, 5, 6, 1,
      -6, 0, 9, 6,
      -3, 0, -9, -4
    ]);

    const expected = new Matrix(4, 4, [
      -0.15385, -0.15385, -0.28205, -0.53846,
      -0.07692, 0.12308, 0.02564, 0.03077,
      0.35897, 0.35897, 0.43590, 0.92308,
      -0.69231, -0.69231, -0.76923, -1.92308
    ]);
    expect(m.inverse().isEqual(expected)).to.be.true;
  });

  it('should be able to calculate the inverse of a third matrix', () => {
    const m = new Matrix(4, 4, [
      9, 3, 0, 9,
      -5, -2, -6, -3,
      -4, 9, 6, 4,
      -7, 6, 6, 2
    ]);

    const expected = new Matrix(4, 4, [
      -0.04074, -0.07778, 0.14444, -0.22222,
      -0.07778, 0.03333, 0.36667, -0.33333,
      -0.02901, -0.14630, -0.10926, 0.12963,
      0.17778, 0.06667, -0.26667, 0.33333
    ]);
    expect(m.inverse().isEqual(expected)).to.be.true;
  });

  it('should be able to multiply a product by its inverse', () => {
    const a = new Matrix(4, 4, [
      3, -9, 7, 3,
      3, -8, 2, -9,
      -4, 4, 4, 1,
      -6, 5, -1, 1
    ]);
    const b = new Matrix(4, 4, [
      8, 2, 2, 2,
      3, -1, 7, 0,
      7, 0, 5, 4,
      6, -2, 0, 5
    ]);
    const c = a.multiply(b);
    expect(c.multiply(b.inverse()).isEqual(a)).to.be.true;
  });

});