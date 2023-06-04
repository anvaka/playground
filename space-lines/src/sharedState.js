export default {
  rgba: 0x51B1D730,
  field: `const dt = 0.01; // Time step for integration

// Vector field definition. Return velocity at point
fn getVelocityAtPoint(pos: vec4f) -> vec4f {
    let x = pos.x;
    let y = pos.y;
    let z = pos.z;
    let w = pos.w;
    // Change this to define a new field:
    return vec4f(10 * (y - x), x * (28 - z) - y, x * y - 1.5*z, 0);
}`
};