import Tensor from './Tensor';
import Vector from './Vector';

export default {
  createGridTensor,
  appendPolyLineTensor,
  createCompositeTensor,
  createRadialTensor
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