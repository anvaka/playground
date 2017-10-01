import Vector from './Vector';

export default class Tensor {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.pos = new Vector(0, 0);
  }

  isDegenerate(p) {
    var _a = this.a(p.x, p.y);
    var _b = this.b(p.x, p.y);
    return isZero(_a) && isZero(_b);
  }

  getEigenVector() {
    var a = this.a;
    var b = this.b;

    // Because our tensor is symmetric and traceless, the eigenvector
    // computation can be simplified:
    
    return {
      major,
      minor,
      eigenvalue
    };

    function major(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      // This is a "normal" way to compute eigenvector for
      // symmetric and traceless matrix:

      // var D = Math.sqrt(_a * _a + _b * _b);
      // return new Vector(-(-_a - D)/_b, 1);

      // This is a property of symmetric tensor field: https://www.cc.gatech.edu/~hays/papers/tenflddesn.pdf
      // We take deviate part of tensor:
      var theta = Math.atan2(_b, _a);
      return new Vector(Math.cos(theta/2), Math.sin(theta/2));
    }

    function minor(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      var D = Math.sqrt(_a * _a + _b * _b);
      return new Vector(-(-_a + D)/_b, 1);
    }

    /**
     * returns eigenvalue for major eigenvector.
     * Minor eigenvalue will be the same, but opposite sign.
     */
    function eigenvalue(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      var D = Math.sqrt(_a * _a + _b * _b);
      return D;
    }
  }
}

function isZero(x) {
  return Math.abs(x) < 1e-3
}