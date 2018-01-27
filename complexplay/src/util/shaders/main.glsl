vec4 get_color(vec2 uv) {
  vec2 c = vec2(0. -1.2);// * sin(u_frame * 0.009));//uv;
  vec2 z = vec2(uv);// + uv * sin(u_frame * 0.009);
  float t = 0.;
  for(int i = 0; i < 32; ++i) {
    if(length(z) < 2.) {
      z = c_mul(z, z) + 0.42*c_cos(c);
      t = float(i);
    }
  }

  return vec4(vec3(t/64., t/32., t/16.), 1.0);
}