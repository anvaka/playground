export default class Matrix {
  /**
   * Creates a new rows x cols matrix initialized with 0 unless
   * `initializer` callback is passed. In which case initializer
   * is called and supposed to return value for each element of the matrix.
   * 
   * @param {number} rows 
   * @param {number} cols 
   * @param {(index: number) => number} initializer
   */
  constructor(rows, cols, initializer) {
    this.cols = cols;
    this.rows = rows;
    if (initializer == null) {
      initializer = () => 0;
    }
    this.storage = new Float32Array(rows * cols);
    for (let i = 0; i < this.storage.length; ++i) this.storage[i] = initializer(i);
  }
  
  /**
   *  Multiplies a * b^T
   * 
   *      a      b
   *     3x1    1x2
   *     [1]
   *     [2] * [4, 5]
   *     [3]
   */
  static fromDotTransposed(a, b) {
    let rows = a.length;
    let cols = b.length;
    
    let matrix = new Matrix(rows, cols);
    for (let row = 0; row < rows; ++row) {
      for (let col = 0; col < cols; ++col) {
        matrix.setValue(row, col, a[row] * b[col])
      }
    }
    return matrix;
  }

  /**
   * Multiplies this matrix by vector `x` and returns a new vector A*x
   * 
   * @param {number[]} x 
   * @param {number[]} out 
   * @returns number[]
   */
  timesVec(x, out = []) {
    if (this.cols != x.length) throw new Error('Dimension mismatch in timesVec');

    for (let row = 0; row < this.rows; ++row) {
      let offset = row * this.cols;
      let sum = 0;
      for (let col = 0; col < this.cols; ++col) {
        sum += this.storage[col + offset] * x[col];
      }
      out[row] = sum;
    }
    
    return out;
  }
  
  transposeTimesVec(x, out = []) {
    if (this.rows != x.length) throw new Error('Dimension mismatch in transposeTimesVec');
    
    for (let col = 0; col < this.cols; ++col) {
      let sum = 0;
      for (let row = 0; row < this.rows; ++row) {
        let offset = row * this.cols;
        sum += this.storage[col + offset] * x[row];
      }
      out[col] = sum;
    }
    
    return out;
  }

  /**
   * Sets row/col value
   * 
   * @param {number} row index
   * @param {number} col index
   * @param {number} v value
   */
  setValue(row, col, v) {
    let index = row * this.cols + col;
    if (index < 0 || index >= this.storage.length) throw new Error('Index out of range');
    
    this.storage[index] = v;
  }
  
  
  addAandB(a, b) {
    a.forEach((x, idx) => {
      a[idx] += b[idx]
    });
    return a;
  }
  
  sub(other, eta = 1) {
    if (other.rows !== this.rows || other.cols !== this.cols) {
      throw new Error('Matrix dimensions mismatch in sub()');
    }
    for (let i = 0; i < this.storage.length; ++i) {
      this.storage[i] -= other.storage[i] * eta;
    }
  }

  /**
   * For debugging purposes
   */
  print() {
    console.log(this.toArrays().map(x => {
      return x.map(x => x.toFixed(2)).join(' ');
    }).join('\n'))
  }
  
  toArrays() {
    let allRows = [];
    for (let row = 0; row < this.rows; ++row) {
      let offset = row * this.cols;
      let rowValues = [];
      allRows.push(rowValues);
      for (let col = 0; col < this.cols; ++col) {
        rowValues.push(this.storage[col + offset])
      }
    }
    return allRows;
  }
}