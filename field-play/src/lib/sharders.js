/**
 * This file is based on https://github.com/mapbox/webgl-wind
 * by Vladimir Agafonkin
 * 
 * Released under ISC License, Copyright (c) 2016, Mapbox
 * https://github.com/mapbox/webgl-wind/blob/master/LICENSE
 * 
 * Adapted to field maps by Andrei Kashcha
 * Copyright (C) 2017
 */
var quadVert = `precision mediump float;

attribute vec2 a_pos;

varying vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}`;

var screenFrag = `precision mediump float;

uniform sampler2D u_screen;
uniform float u_opacity;

varying vec2 v_tex_pos;

void main() {
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}`;

// TODO: need to add color?
var drawFrag = `precision mediump float;

varying vec2 v_particle_pos;

void main() {
   gl_FragColor = vec4(0.3, 0.74, 0.79, 1.0);
}`;

var drawVert = `precision mediump float;

attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;

varying vec2 v_particle_pos;

void main() {
    vec4 encSpeed = texture2D(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res));

    // decode current particle position from the pixel's RGBA value
    v_particle_pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);

    gl_PointSize = 1.0;
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, (1. - 2. *(v_particle_pos.y)),  0., 1.);
}`

// TODO: Need to read from the texture
var updateFrag = `precision highp float;

uniform sampler2D u_particles;
uniform vec4 u_timer;
uniform vec2 u_min;
uniform vec2 u_max;
uniform float u_rand_seed;
uniform float u_drop_rate;
uniform float u_drop_rate_bump;

varying vec2 v_tex_pos;


// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

void udf_vector_field(const vec2 p, out vec2 v) {
    v.x = -p.y;
    v.y = p.x;
    // float l = length(p);
    // v = -p * 0.3 /(l * l * sin(l));
}

vec2 get_velocity(const vec2 pos) {
    vec2 velocity;
    udf_vector_field(pos, velocity);
    return velocity;
}

vec2 rk4(const vec2 point) {
    float h = 0.01;
    vec2 k1 = get_velocity( point );          
    vec2 k2 = get_velocity( point + k1 * h * 0.5);
    vec2 k3 = get_velocity( point + k2 * h * 0.5);
    vec2 k4 = get_velocity( point + k3 * h);

    return k1 * h / 6. + k2 * h/3. + k3 * h/3. + k4 * h/6.;
}

void main() {
    vec4 encSpeed = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(
        encSpeed.r / 255.0 + encSpeed.b,
        encSpeed.g / 255.0 + encSpeed.a); // decode particle position from pixel RGBA

    vec2 du = (u_max - u_min);
    pos.x = pos.x * du.x + u_min.x;
    pos.y = pos.y * du.y + u_min.y;
    vec2 velocity = rk4(pos);
    pos = pos + velocity;
    pos.x = (pos.x - u_min.x)/du.x;
    pos.y = (pos.y - u_min.y)/du.y;

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + 0.02 * length(velocity) * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
    pos = mix(pos, random_pos, drop);

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(fract(pos * 255.0), floor(pos * 255.0) / 255.0);
}`;

export default {
  quadVert: quadVert,
  screenFrag: screenFrag,
  drawFrag: drawFrag,
  drawVert: drawVert,
  updateFrag: updateFrag
};