import { EPSILON } from './constants.js';

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
}