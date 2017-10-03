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

// TODO: this need to be initialized properly
var drawFrag = `precision mediump float;

uniform sampler2D u_wind;
uniform vec2 u_wind_min;
uniform vec2 u_wind_max;
// uniform sampler2D u_color_ramp;

varying vec2 v_particle_pos;

void main() {
//     vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, v_particle_pos).rg);
//     float speed_t = length(velocity) / length(u_wind_max);

//     // color ramp is encoded in a 16x16 texture
//     vec2 ramp_pos = vec2(
//         fract(16.0 * speed_t),
//         floor(16.0 * speed_t) / 16.0);

//     gl_FragColor = texture2D(u_color_ramp, ramp_pos);
   gl_FragColor = vec4(0.3, 0.74, 0.79, 1.0);
}`;

var drawVert = `precision mediump float;

attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;

varying vec2 v_particle_pos;

void main() {
    vec4 color = texture2D(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res));

    // decode current particle position from the pixel's RGBA value
    v_particle_pos = vec2(
        color.r / 255.0 + color.b,
        color.g / 255.0 + color.a);

    gl_PointSize = 1.0;
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
}`

// TODO: Need to read from the texture
var updateFrag = `precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_wind;
uniform vec2 u_wind_min;
uniform vec2 u_wind_res;
uniform vec2 u_wind_max;
uniform float u_rand_seed;
// uniform float u_speed_factor;
uniform float u_drop_rate;
uniform float u_drop_rate_bump;

varying vec2 v_tex_pos;

// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

vec2 get_velocity(const vec2 pos) {
    vec4 vColor = texture2D(u_wind, pos) * 255.0;
    vec2 dist = u_wind_max - u_wind_min;
    float tx = dist.x * (vColor.r * 255.0 + vColor.b)/(65535.) + u_wind_min.x;
    float ty = dist.y * (vColor.g * 255.0 + vColor.a)/(65535.) + u_wind_min.y;

    return vec2(tx, -ty);
}

// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_wind(const vec2 uv) {
    // return texture2D(u_wind, uv).rg; // lower-res hardware filtering
    vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    // vec2 tl = texture2D(u_wind, vc).rg;
    // vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    // vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    // vec2 br = texture2D(u_wind, vc + px).rg;
    vec2 tl = get_velocity(vc);
    vec2 tr = get_velocity(vc + vec2(px.x, 0));
    vec2 bl = get_velocity(vc + vec2(0, px.y));
    vec2 br = get_velocity(vc + px);
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

void main() {
    vec4 color = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(
        color.r / 255.0 + color.b,
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA

    // vec2 velocity =  mix(u_wind_min, u_wind_max, texture2D(u_wind, pos).rg);
    // vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(pos));

    vec2 velocity = lookup_wind(pos);
    //vec2 velocity = get_velocity(pos);
    pos = pos + 0.002 * velocity;

    float speed_t = 0.01 * length(velocity);

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(
        rand(seed + 1.3),
        rand(seed + 2.1));
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