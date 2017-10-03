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
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
}`

// TODO: Need to read from the texture
var updateFrag = `precision highp float;

uniform sampler2D u_particles;
uniform vec3 u_camera;
uniform vec2 u_screen_size;
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
    v.x = sin(p.y) * exp(p.x);
    v.y = cos(p.x) * sin(p.x);
}

vec2 get_velocity(const vec2 pos) {
    vec2 velocity;
    vec2 vv = u_camera.yz/u_screen_size;

    udf_vector_field(vec2(pos.x, pos.y)/u_camera.x  - vv /u_camera.x, velocity);
    return velocity;
}

void main() {
    vec4 encSpeed = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(
        encSpeed.r / 255.0 + encSpeed.b,
        encSpeed.g / 255.0 + encSpeed.a); // decode particle position from pixel RGBA

    vec2 velocity = get_velocity(pos);
    pos = pos + 0.002 * velocity;

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + 0.01 * length(velocity) * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
    pos = mix(pos, random_pos, drop);

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(
        fract(pos * 255.0),
        floor(pos * 255.0) / 255.0);
}`;

export default {
  quadVert: quadVert,
  screenFrag: screenFrag,
  drawFrag: drawFrag,
  drawVert: drawVert,
  updateFrag: updateFrag
};