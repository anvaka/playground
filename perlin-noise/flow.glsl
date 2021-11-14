// I was just playing with https://anvaka.github.io/fieldplay
// this is not fully working
float rnd(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float getDir(vec2 p,vec2 co) {
  float a = rnd(co);
  return dot(p - co, vec2(cos(a),sin(a)));
}

float interp(float x, float l, float r) {
  return l + x * x * x * (x * (x * 6.-15.) + 10.)*(r - l);
}

vec2 get_velocity(vec2 p) {
  vec2 v = vec2(0., 0.);
  vec2 c = floor(p);
  float tl = getDir(p, c);
  float tr = getDir(p, vec2(c.x+1., c.y));
  float br = getDir(p, vec2(c.x+1., c.y+1.));
  float bl = getDir(p, vec2(c.x, c.y+1.));
  float xTop = interp(p.x - c.x, tl, tr);
  float xBot = interp(p.x - c.x, bl, br);
  float a = interp(p.y - c.y, xTop, xBot);
  v.x = cos(a);
  v.y = sin(a);
  // v.y = -0.2 * cell.y;

  return v;
}
