import Vector from './Vector';
import Tensor from './Tensor';
import sivg from 'simplesvg';

var cellWidth = 10;
var arrows = []
var point = new Vector(-1, 1.1);
var radial = createRadialTensor(0, 0)
var radiaDx = createRadialTensor(-5, -5);
var gridDx = createGridTensor(5, -5, Math.PI);
var composition = [radial, radiaDx, gridDx];
var composition = [];
appendPolyLineTensor(composition, [{x: -5, y: 0}, {x: 0, y: -2}, {x: 3, y: -10}]);
var composite = createCompositeTensor(composition, 1);
var vectorField = radial.getEigenVector(); 
// var vectorField = function(x, y) {
//   return [{
//     vector: new Vector(-y, x),
//     value: 0
//   }, {
//     vector: new Vector(-(y + 2)/x, 1),
//     value: 0
//   }]
// };

function createGridTensor(x, y, direction) {
  var tensor = new Tensor(a, b);

  tensor.pos = new Vector(x, y);
  return tensor;

  function a(x, y) {
    return Math.cos(2 * direction);
  }
  function b(x, y) {
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
  var distanceThreshold = 1e-9;
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
//         if (Number.isNaN(e)) continue;
//         if (e < distanceThreshold) e = distanceThreshold;
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
    return -2 * (x - dx) * (y - dy);
  }

}

export default function drawAll() {
  for (var x = -10.1; x < 10; x += 0.5) {
    for (var y = -10.1; y < 10; y += 0.5) {
        drawArrow(x, y); 
    } 
  }

  var points = [point];

  for (var i = 0; i < 300; ++i) {
    var direction = samplePoint(point, 0.1);
    var l = direction.length();
  //   if (l < 1e-8 || !Number.isFinite(l)) break;
    
    point = new Vector(point.x + direction.x, point.y + direction.y);
    points.push(point); 
  }

  var p = document.getElementById('path');
  drawAllArrows(arrows);
  // p.setAttributeNS(null, 'd', toPath(arrows)); 
  var sline = document.getElementById('sline');
  sline.setAttributeNS(null, 'd', toPolyPath(points));

}

function samplePoint(point, h) { 
//   var p = sample_vector_field( point );
//   return p;
  var k1 = sample_vector_field( point );          
  var k2 = sample_vector_field( point.add(k1.mul(h/2)) )
  var k3 = sample_vector_field( point.add(k2.mul(h/2)) )
  var k4 = sample_vector_field( point.add(k3.mul(h)));

  var dv = k1.mul(h/6).add(k2.mul(h/3)).add(k3.mul(h/3)).add(k4.mul(h/6));
  return dv;
  
  function sample_vector_field(p) {
    return vectorField(p.x, p.y)[1].vector;
  }
} 


function drawArrow(x, y) { 
  var ox = x * cellWidth; 
  var oy = y * cellWidth; 
  
  var eigenVectors = vectorField(x, y);
//   drawFor(eigenVectors[0].vector)
  drawFor(eigenVectors[1].vector)
  
  function drawFor(vf) {
    var dx = 0;
    var dy = 0;
    if (vf.length() !== 0){
      var vf_norm = vf.norm();
    
     dx = 0.25 * cellWidth * vf_norm.x;
     dy = 0.25 * cellWidth * vf_norm.y;
    }

    arrows.push({
      from: {
        x: ox, // - dx/3,
        y: oy, // - dx/3
      }, 
      to: {
        x: ox + dx,
        y: oy + dy
      }
    })
  }
}

function drawAllArrows(arrows) {
  var container = document.getElementById('points');
  arrows.forEach(function (arr) {
    var path = sivg('path', {
      'stroke-width': '1',
      stroke: 'black',
      fill:'transparent',
      d: toSegment(arr),
      'marker-end':'url(#head)'
    });
    container.appendChild(path);
  })
}

function toPolyPath(arr) {
  return 'M' + (arr.map(function(p) {
    return toSVG({x: p.x * cellWidth, y: p.y * cellWidth})
  }).join(' '))
}


function toPath(arr) {
  return arr.map(toSegment).join(' '); 
}

function toSegment(segment) {
    return 'M' + toSVG(segment.from) + ' ' +
      toSVG(segment.to);
  }
function toSVG(p) {
  return p.x + ',' + p.y;
}