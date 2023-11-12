import { EPSILON } from './constants.js';
import { Tuple } from './tuple.js';

export class Matrix {
  constructor(rows, columns, data) {
    this.rows = rows;
    this.columns = columns;
    this.data = new Array(rows * columns);
    if (Array.isArray(data)) {
      this.setData(data);
    } else {
      this.data.fill(0);
    }
  }

  get(row, column) {
    if (row < 0 || row >= this.rows) throw new Error('row out of bounds')
    if (column < 0 || column >= this.columns) throw new Error('column out of bounds');
    return this.data[row * this.columns + column];
  }

  set(row, column, value) {
    if (row < 0 || row >= this.rows) throw new Error('row out of bounds');
    if (column < 0 || column >= this.columns) throw new Error('column out of bounds');
    this.data[row * this.columns + column] = value;
  }

  setData(data) {
    if (data.length !== this.rows * this.columns) throw new Error('data size mismatch');
    this.data = data;
  }

  isEqual(other) {
    if (this.rows !== other.rows || this.columns !== other.columns) return false;

    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        let idx = row * this.columns + column;
        if (Math.abs(this.data[idx] - other.data[idx]) > EPSILON) return false;
      }
    }
    return true;
  }

  multiply(other) {
    if (this.rows === 4 && (other instanceof Tuple)) {
      return new Tuple(
        this.get(0, 0) * other.x + this.get(0, 1) * other.y + this.get(0, 2) * other.z + this.get(0, 3) * other.w,
        this.get(1, 0) * other.x + this.get(1, 1) * other.y + this.get(1, 2) * other.z + this.get(1, 3) * other.w,
        this.get(2, 0) * other.x + this.get(2, 1) * other.y + this.get(2, 2) * other.z + this.get(2, 3) * other.w,
        this.get(3, 0) * other.x + this.get(3, 1) * other.y + this.get(3, 2) * other.z + this.get(3, 3) * other.w
      );
    }
    if (this.columns !== other.rows) throw new Error('matrix size mismatch');
    let result = new Matrix(this.rows, other.columns);
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < other.columns; column++) {
        let sum = 0;
        for (let i = 0; i < this.columns; i++) {
          sum += this.get(row, i) * other.get(i, column);
        }
        result.set(row, column, sum);
      }
    }
    return result;
  }

  transpose() {
    let result = new Matrix(this.columns, this.rows);
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        result.set(column, row, this.get(row, column));
      }
    }
    return result;
  }

  submatrix(row, column) {
    let result = new Matrix(this.rows - 1, this.columns - 1);
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.columns; c++) {
        let sourceRow = r < row ? r : r + 1;
        let sourceColumn = c < column ? c : c + 1;
        result.set(r, c, this.get(sourceRow, sourceColumn));
      }
    }
    return result;
  }

  determinant() {
    if (this.rows !== this.columns) throw new Error('matrix is not square');
    if (this.rows === 2) {
      return this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0);
    }
    let result = 0;
    for (let column = 0; column < this.columns; column++) {
      result += this.get(0, column) * this.cofactor(0, column);
    }
    return result;
  }

  minor(row, column) {
    return this.submatrix(row, column).determinant();
  }

  cofactor(row, column) {
    let minor = this.minor(row, column);
    if ((row + column) % 2 === 0) return minor;
    return -minor;
  }

  isInvertible() {
    return this.determinant() !== 0;
  }

  inverse() {
    if (!this.isInvertible()) throw new Error('matrix is not invertible');
    let result = new Matrix(this.rows, this.columns);
    let determinant = this.determinant();
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        let cofactor = this.cofactor(row, column);
        result.set(column, row, cofactor / determinant);
      }
    }
    return result;
  }

  static identity(size) {
    let result = new Matrix(size, size);
    for (let i = 0; i < size; i++) {
      result.set(i, i, 1);
    }
    return result;
  }
}