import Vector from './Vector';

export default class Tensor {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.pos = new Vector(0, 0);
  }

  getEigenVector() {
    var a = this.a;
    var b = this.b;

    // Because our tensor is symmetric and traceless, the eignevector
    // computation can be simplified:
    
    return {
      major,
      minor,
      eigenvalue
    };

    function major(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      var D = Math.sqrt(_a * _a + _b * _b);
      return new Vector(-(-_a - D)/_b, 1);
    }

    function minor(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      var D = Math.sqrt(_a * _a + _b * _b);
      return new Vector(-(-_a + D)/_b, 1);
    }

    function eigenvalue(x, y) {
      var _a = a(x, y);
      var _b = b(x, y);
      
      var D = Math.sqrt(_a * _a + _b * _b);
      return D;
    }
  }
}