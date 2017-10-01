import Tensor from './Tensor';
import Vector from './Vector';

export default {
  createGridTensor,
  appendPolyLineTensor,
  createCompositeTensor,
  createRadialTensor,
  explicit
}

function explicit(center) {
  return {
    isDegenerate: () => false,
    getEigenVector() {
      return {
        major,
      };
      function major(x, y) {
        var centers = [{
          t: new Vector(-5, 0),
          strength: 1
        }, {
          t: new Vector(5, 0),
          strength: 1
        }, {
          t: new Vector(0, 5),
          strength: 1
        }, {
          t: new Vector(2, -5),
          strength: 1
        }]
        var sum = new Vector(0, 0);
        for (var i = 0; i < centers.length; ++i) {
          var c = centers[i];
          var dist = c.t.distanceSquaredTo(x, y);
          var e = 1/(1.0 + dist);
          sum.y += (x - c.t.x) * c.strength * e;
          sum.x += -(y - c.t.y) * c.strength * e;
        }

        return sum;

        var t1 = new Vector(-5, 0);
        var d1 = t1.distanceSquaredTo(x, y);

        var t2 = new Vector(5, 0);
        var d2 = t2.distanceSquaredTo(x, y);

        var e1 = 1/(0.1 + d1); // Math.exp(-s * d1)/(d1);
        var e2 = 1/(0.1 + d2); // Math.exp(-s * d2)/(d2);
        var st1 = 1.0;
        var st2 = 1.0;

        var total = new Vector(
          -(y - t1.y) * st1 * e1 - (y - t2.y) * st2 * e2,
          (x - t1.x) * st1 * e1 + (x - t2.x) *st2 * e2
        );
        return total;
      }
    }
  }

}

function createGridTensor(x, y, direction) {
  var tensor = new Tensor(a, b);

  tensor.pos = new Vector(x, y);
  return tensor;

  function a(/* x, y */) {
    return Math.cos(2 * direction);
  }
  function b(/* x, y */) {
    return Math.sin(2 * direction);
  }
}

function appendPolyLineTensor(composition, polyline) {
  polyline.forEach(function(point, idx) {
    if (idx === polyline.length - 1) return;
    var ux = -point.x + polyline[idx + 1].x;
    var uy = -point.y + polyline[idx + 1].y;
    var direction = Math.atan2(uy, ux);
    var t = createGridTensor(point.x, point.y, direction);
    composition.push(t);
  })
}

function createCompositeTensor(tensors, d) {
  var distanceThreshold = 1e-7;
  var lnThreshold = -Math.log(distanceThreshold);
  
  return new Tensor(rbf('a'), rbf('b'));
  
  function rbf(fn) {
    return function(x, y) { 
      var sum = 0;
      for(var i = 0; i < tensors.length; ++i) {
        var t = tensors[i];
        var dist = t.pos.distanceSquaredTo(x, y);
        var p = d * dist;
        var e;
        if (p > lnThreshold) {
          e = distanceThreshold;
        } else {
          e = Math.exp(-p); 
        }
        sum += e * t[fn](x, y);
      }

      return sum;
    }
  }
} 

function createRadialTensor(dx, dy) {
  var tensor = new Tensor(a, b);
  tensor.pos = new Vector(dx, dy);
  return tensor;

  function a(x, y) {
    return (y - dy) * (y - dy) - (x - dx) * (x - dx);
  }

  function b(x, y) {
    return  -2 * (x - dx) * (y - dy);
  }
}