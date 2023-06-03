import { mat4, vec3 } from 'gl-matrix';
import eventify from 'ngraph.events';

export default class ViewMatrix {
  constructor(drawContext) {
    eventify(this);

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

    /**
     * When we shoot particles - how far are they from the view?
     */
    this.targetDistance = 5;

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

    this.fire('updated', this);

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
