export default findIntersection;

//https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm
// cx, cy = center of the circle
// r - radius
// ex, ey - start of the ray
// lx, ly - end of the ray
function findIntersection(cx, cy, r, ex, ey, lx, ly) {
  var dx = lx - ex;
  var dy = ly - ey;
  
  var fx = ex - cx;
  var fy = ey - cy;
  
  var a = dx * dx + dy * dy;
  var b = 2*(fx * dx + fy * dy);
  var c = fx * fx + fy * fy - r*r ;
  var discriminant = b*b-4*a*c;
  if( discriminant < 0 ) return;   // no intersection
  
  // ray didn't totally miss sphere,
  // so there is a solution to
  // the equation.

  discriminant = Math.sqrt( discriminant );

  // either solution may be on or off the ray so need to test both
  // t1 is always the smaller value, because BOTH discriminant and
  // a are nonnegative.
  var t1 = (-b - discriminant)/(2*a);
  var t2 = (-b + discriminant)/(2*a);
  // 3x HIT cases:
  //          -o->             --|-->  |            |  --|->
  // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

  // 3x MISS cases:
  //       ->  o                     o ->              | -> |
  // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)


  if( t1 >= 0 && t1 <= 1 ) {
    // t1 is the intersection, and it's closer than t2
    // (since t1 uses -b - discriminant)
    // Impale, Poke
    var t1x = ex + t1 * dx;
    var t1y = ey + t1 * dy;
    return {x: t1x, y: t1y};
  }

  // here t1 didn't intersect so we are either started
  // inside the sphere or completely past it
  if( t2 >= 0 && t2 <= 1 ) {
    // ExitWound
    var t2x = ex + t2 * dx;
    var t2y = ey + t2 * dy;
    return {x: t2x, y: t2y};

  }

  // no intn: FallShort, Past, CompletelyInside
  return false ;
}