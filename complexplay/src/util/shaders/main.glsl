vec4 get_color(vec2 uv) {
  vec2 c = uv, z = vec2(0.);
  float t;
  for(int i = 0; i < 32; ++i) {
    if(length(z) > 2.) break;
    // main fractal loop. Change it:
    z = c_mul(z, z) + c;
    t = float(i);
  }

  return length(z) * vec4(t/64., t/32., t/24., 1.0);
}