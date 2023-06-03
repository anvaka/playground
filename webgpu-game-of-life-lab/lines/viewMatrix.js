let spareVec3 = [0, 0, 0];
const xAxis = [1, 0, 0];
const yAxis = [0, 1, 0];
const zAxis = [0, 0, 1];

let {mat4, vec3} = glMatrix;
const axesEl = document.querySelector('.axes-container .axes');
const locationEl = document.querySelector('.axes-container .location');
const pitchEl = document.querySelector('.axes-container .ship-pitch');

/**
 * View matrix allows you to place camera anywhere in the world
 */
export default class ViewMatrix {
  constructor(drawContext) {
    /**
     * This is our view matrix
     */
    this.matrix = mat4.create();

    // True position of the camera in the world:
    /**
     * Inverse of the view matrix
     */
    this.cameraWorld = mat4.invert(mat4.create(), this.matrix);

    /**
     * Camera position in the world
     */
    this.position = [0, -5, 10];
    /**
     * Camera orientation in the world
     */
    this.orientation = [0, 0, 0, 1];
    /**
     * Where the camera is looking
     */
    this.center = [0, 0, 0];

    this.projection = mat4.create();
    mat4.perspective(this.projection, drawContext.fov, 1, 0.1, 1000);

    this.inverseProjection = mat4.create();
    this.modelViewProjection = mat4.create();


    mat4.lookAt(this.matrix, this.position, this.center, [0, 1, 0]);
    mat4.invert(this.cameraWorld, this.matrix);
    this.deconstructPositionRotation();
    this.update();
  }

  /**
   * Makes the view look at a given point
   */
  lookAt(eye, center, up) {
    mat4.targetTo(this.cameraWorld, eye , center, up);
    mat4.invert(this.matrix, this.cameraWorld);
    this.deconstructPositionRotation();
    return this;
  }

  /**
   * Updates view matrix from the current orientation and position
   */
  update() {
    mat4.fromRotationTranslation(this.cameraWorld, this.orientation, this.position);
    mat4.invert(this.matrix, this.cameraWorld);

    mat4.multiply(this.modelViewProjection, this.projection, this.matrix);
    this.updated = true;

    let delta = vec3.transformQuat([0, 0, 0], [0, 0, -5], this.orientation);

    let xyAngle = Math.round(180 * Math.atan2(delta[1], delta[0]) / Math.PI - 90);

    axesEl.style.transform = `rotate(${xyAngle}deg)`;
    locationEl.textContent = `[${this.position.map(n => n.toFixed(2)).join(', ')}]`;

    let pitch = getPitchFromQuaternion(this.orientation);
    pitchEl.style.transform = `rotate(${pitch}deg)`;

    return this;
  }

  /**
   * Extracts current position and orientation from the `cameraWorld` matrix
   */
  deconstructPositionRotation() {
    mat4.getTranslation(this.position, this.cameraWorld);
    mat4.getRotation(this.orientation, this.cameraWorld);
  }

  translateOnAxis(axis, distance) {
    let translation = vec3.transformQuat(spareVec3, axis, this.orientation);
    vec3.scaleAndAdd(this.position, this.position, translation, distance);
    return this;
  } 

  translateX(distance) {
    return this.translateOnAxis(xAxis, distance);
  }

  translateY(distance) {
    return this.translateOnAxis(yAxis, distance);
  }

  translateZ(distance) {
    return this.translateOnAxis(zAxis, distance);
  }
}


  function getPitchFromQuaternion(q) {
    let x = q[0];
    let y = q[1];
    let z = q[2];
    let w = q[3];
    let pitch = 90-Math.round(180 * Math.atan2(2 * (y * z + w * x), w * w - x * x - y * y + z * z) / Math.PI);
    return pitch;
  }