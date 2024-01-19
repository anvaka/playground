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
    this.position = [0, 0, 42];
    /**
     * Camera orientation in the world
     */
    this.orientation = [0, 0, 0, 1];
    /**
     * Where the camera is looking
     */
    this.center = [0, 0, 0];

    this.projection = mat4.create();
    this.fov = drawContext.fov;
    this.drawContext = drawContext;

    const ar = drawContext.width/drawContext.height;

    this.inverseProjection = mat4.create();
    this.modelViewProjection = mat4.create();

    mat4.perspective(this.projection, drawContext.fov, ar, 0.1, 1000);
    mat4.invert(this.inverseProjection, this.projection);
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

  updateSize(width, height, fov) {
    const ar = width/height;
    mat4.perspective(this.projection, fov, ar, 0.1, 1000);
    mat4.invert(this.inverseProjection, this.projection);
    this.update();
  }

  showRectangle(rect) {
    this.position[0] = rect.left + rect.width/2;
    this.position[1] = rect.top - rect.height/2;
    this.position[2] = rect.height/2 / Math.tan(this.fov/2);
    this.center[0] = rect.left + rect.width/2;
    this.center[1] = rect.top - rect.height/2;
    mat4.lookAt(this.matrix, this.position, this.center, [0, 1, 0]);
    mat4.invert(this.cameraWorld, this.matrix);
    this.deconstructPositionRotation();
    this.update();
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

  getSceneCoordinate(clientX, clientY, canvasRect, dpr = 1) {
    clientX -= canvasRect.left;
    clientY -= canvasRect.top;
    let clipSpaceX = (clientX / this.drawContext.width) * 2 - 1;
    let clipSpaceY = (1 - clientY / this.drawContext.height) * 2 - 1;

    let spare = [0, 0, 0];
    let mx = vec3.transformMat4(spare, [clipSpaceX, clipSpaceY, 0], this.inverseProjection);
    vec3.transformMat4(mx, mx, this.cameraWorld);

    vec3.sub(mx, mx, this.position);
    vec3.normalize(mx, mx);
    var targetZ = 0;

    // TODO: This is likely not going to work for all cases.
    var distance = (targetZ - this.position[2]) / mx[2];
    if (mx[2] > 0) {
      // ray shoots backwards.
    }

    vec3.scaleAndAdd(mx, this.position, mx, distance);
    return mx; 
  }
}