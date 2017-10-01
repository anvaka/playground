import Vector from './Vector';
import sivg from 'simplesvg';

var scale = 10;

export function getFieldPath(vectorField) {
  var arrows = []
  for (var x = -10.1; x < 10; x += 0.5) {
    for (var y = -10.1; y < 10; y += 0.5) {
        var vf = vectorField.major(x, y);
        var arrow = drawArrow(x, y, vf); 
        arrows.push(arrow);
    } 
  }

  return toPath(arrows);
}

export function traceLine(tensor, point) {
  var vectorField = tensor.getEigenVector();
  var points = [];
//  var previousDirection = new Vector(0, 0);

  for (var i = 0; i < 200; ++i) {
    if (tensor.isDegenerate(point)) {
      console.log('degenerate')
      break;
    }
    points.push(point); 
    var direction = integratePoint(point, 0.1);
    // var dotProduct = direction.dot(previousDirection);
    // if (dotProduct < 0) {
    //   direction.x = -direction.x;
    //   direction.y = -direction.y;
    // }
//     console.log(direction.x, direction.y, direction.length());

 //   previousDirection = direction;
    point = new Vector(point.x + direction.x, point.y + direction.y);
  }

  return toPolyPath(points);

  function integratePoint(point, h) { 
    var k1 = sample_vector_field( point );          
    var k2 = sample_vector_field( point.add(k1.mul(h/2)) )
    var k3 = sample_vector_field( point.add(k2.mul(h/2)) )
    var k4 = sample_vector_field( point.add(k3.mul(h)));

    var dv = k1.mul(h/6).add(k2.mul(h/3)).add(k3.mul(h/3)).add(k4.mul(h/6));

    return dv;
  } 

  function sample_vector_field(p) {
    return vectorField.major(p.x, p.y);
  }
}

function drawArrow(x, y, vf) { 
  var ox = x; 
  var oy = y; 
  
  var dx = 0;
  var dy = 0;
  if (vf.length() !== 0){
    var vf_norm = vf.norm();
  
    dx = 0.25 * vf_norm.x;
    dy = 0.25 * vf_norm.y;
  }

  return {
    from: {
      x: ox,
      y: oy,
    }, 
    to: {
      x: ox + dx,
      y: oy + dy
    }
  };
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
  return 'M' + arr.map(toSVG).join(' ')
}

function toPath(arr) {
  return arr.map(toSegment).join(' '); 
}

function toSegment(segment) {
  return 'M' + toSVG(segment.from) + ' ' + toSVG(segment.to);
}

function toSVG(p) {
  return p.x * scale + ',' + p.y * scale;
}