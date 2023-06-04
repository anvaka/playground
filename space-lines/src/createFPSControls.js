import {vec3, quat, mat4} from 'gl-matrix';
import eventify from 'ngraph.events';

const FRONT_VECTOR = [0, 0, -1];

export const INPUT_COMMANDS = {
  MOVE_FORWARD:  1,
  MOVE_BACKWARD: 2,
  MOVE_LEFT:  3,
  MOVE_RIGHT: 4,
  MOVE_UP:    5,
  MOVE_DOWN:  6,
  TURN_LEFT:  7,
  TURN_RIGHT: 8,
  TURN_UP:    9,
  TURN_DOWN:  10,
}

/**
 * Game input controls similar to the first player games, where user can "walk" insider
 * the world and look around.
 */
export default function createFPSControls(drawContext, onAddLine) {
  // Very likely spaceMap camera can be adjusted to support this navigation model too, but
  // for now, I'm using a separate camera. Should consider uniting them in the future if possible.
  let {view} = drawContext;

  // Player in the world is placed where the camera is:
  let cameraPosition = view.position;

  // And they look at the "center" of the scene:
  let centerPosition = view.center;

  // The camera follows "FPS" mode, but implemented on quaternions.
  let sceneOptions = {};
  const upVector = [0, 0, 1];

  let rotationSpeed = Math.PI;
  let inclinationSpeed = Math.PI * 1.618;

  let captureMouse = option(sceneOptions.captureMouse, true); // whether rotation is done via locked mouse
  let mouseX, mouseY;
  let scrollRotation = [0, 0, 0, 1];
  let scrollT = 0;
  let originalOrientation = [0, 0, 0, 1];
  let targetOrientation = [0, 0, 0, 1];
  let scrollDirection = [0, 0, 0];
  let lastScrollTime = 0, lastScrollX = 0, lastScrollY = 0;;

  const inputTarget = drawContext.canvas;
  inputTarget.style.outline = 'none';
  if (!inputTarget.getAttribute('tabindex')) {
    inputTarget.setAttribute('tabindex', '0');
  }
  inputTarget.addEventListener('keydown', handleKeyDown);
  inputTarget.addEventListener('keyup', handleKeyUp);
  inputTarget.addEventListener('mousedown', handleMouseDown);
  inputTarget.addEventListener('touchmove', handleTouchMove);
  inputTarget.addEventListener('touchstart', handleTouchStart);
  inputTarget.addEventListener('wheel', handleWheel);

  document.addEventListener('pointerlockchange', onPointerLockChange, false);
  
  let frameHandle = 0;
  let vx = 0, vy = 0, vz = 0; // velocity of the panning
  let dx = 0, dy = 0, dz = 0; // actual offset of the panning
  let dPhi = 0, vPhi = 0; // rotation 
  let dIncline = 0, vIncline = 0; // inclination
  let moveState = {
    [INPUT_COMMANDS.MOVE_FORWARD]:  false,
    [INPUT_COMMANDS.MOVE_BACKWARD]: false,
    [INPUT_COMMANDS.MOVE_LEFT]:     false,
    [INPUT_COMMANDS.MOVE_RIGHT]:    false,
    [INPUT_COMMANDS.MOVE_UP]:       false,
    [INPUT_COMMANDS.MOVE_DOWN]:     false,
    [INPUT_COMMANDS.TURN_LEFT]:     false,
    [INPUT_COMMANDS.TURN_RIGHT]:    false,
    [INPUT_COMMANDS.TURN_UP]:       false,
    [INPUT_COMMANDS.TURN_DOWN]:     false,
  };
  let moveSpeed = .01; // TODO: Might wanna make this computed based on distance to surface
  let scrollSpeed = 3;
  let flySpeed = 1e-2;

  const api = {
    dispose,
    handleCommand,
    setViewBox,
    getUpVector,
    lookAt,
    enableMouseCapture,
    setRotationSpeed(speed) { rotationSpeed = speed; return api; },
    setMoveSpeed(speed) { moveSpeed = speed; return api; },
    setScrollSpeed(speed) { scrollSpeed = speed; return api; },
    setFlySpeed(speed) { flySpeed = speed; return api; },
    setSpeed(factor) { moveSpeed = factor; flySpeed = factor; return api; },
    getRotationSpeed() { return rotationSpeed; },
    getMoveSpeed() { return moveSpeed; },
    getScrollSpeed() { return scrollSpeed; },
    getFlySpeed() { return flySpeed; },
    getKeymap() { return keyMap; },
    getMouseCapture() { return captureMouse; }
  };

  const keyMap = {
    /* W */ 87: INPUT_COMMANDS.MOVE_FORWARD,
    /* A */ 65: INPUT_COMMANDS.MOVE_LEFT,
    /* S */ 83: INPUT_COMMANDS.MOVE_BACKWARD,
    /* D */ 68: INPUT_COMMANDS.MOVE_RIGHT,
    /* Q */ 81: INPUT_COMMANDS.TURN_LEFT,
    /* ← */ 37: INPUT_COMMANDS.TURN_LEFT,
    /* E */ 69: INPUT_COMMANDS.TURN_RIGHT,
    /* → */ 39: INPUT_COMMANDS.TURN_RIGHT,
    /* ↑ */ 38: INPUT_COMMANDS.TURN_UP,
    /* ↓ */ 40: INPUT_COMMANDS.TURN_DOWN,
/* Shift */ 16: INPUT_COMMANDS.MOVE_DOWN,
/* Space */ 32: INPUT_COMMANDS.MOVE_UP
  };

  eventify(api);
  return api;

  function handleKeyDown(e) {
    onKey(e, 1);
  }

  function handleKeyUp(e) {
    onKey(e, 0);
  }

  function handleMouseDown(e){
    if (e.which !== 1) return; // only left button works here.

    if (document.pointerLockElement) {
      notifyLineAdded();
      // document.exitPointerLock();
    } else if (captureMouse) {
      inputTarget.requestPointerLock();
    } else {
      inputTarget.focus();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      mouseX = e.clientX;
      mouseY = e.clientY;
      e.preventDefault();
    }
  }

  function notifyLineAdded() {
    const delta = vec3.transformQuat([0, 0, 0], [0, 0, -view.targetDistance], view.orientation);
    onAddLine([
      view.position[0] + delta[0], view.position[1] + delta[1], view.position[2] + delta[2], 0
    ])
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return; // TODO: implement pinch move?
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }

  function handleWheel(e) {
    e.preventDefault();

    // in windows FF it scrolls differently. Want to have the same speed there:
    let deltaFactor = e.deltaMode > 0 ? 100 : 1;
    let scaleFactor = scrollSpeed * getScaleFactorFromDelta(-e.deltaY * deltaFactor);
    let now = +new Date();
    let nx = e.clientX, ny = e.clientY;

    if (document.pointerLockElement) {
      nx = drawContext.width /(drawContext.pixelRatio *2);
      ny = drawContext.height / (drawContext.pixelRatio * 2);
    }
    if (document.pointerLockElement || now - lastScrollTime > 200 || Math.hypot(nx - lastScrollX, ny - lastScrollY) > 20) {
      let cursorPos = [0, 0, -1];
      cursorPos[0] = (nx * drawContext.pixelRatio / drawContext.width - 0.5) * 2;
      cursorPos[1] = ((1 - ny * drawContext.pixelRatio / drawContext.height) - 0.5) * 2;
      vec3.transformMat4(cursorPos, cursorPos, 
        mat4.mul([
          0, 0, 0, 0, 
          0, 0, 0, 0, 
          0, 0, 0, 0, 
          0, 0, 0, 0
        ], drawContext.view.cameraWorld, drawContext.inverseProjection));

      scrollDirection = vec3.sub([0, 0, 0], cursorPos, view.position);
      vec3.normalize(scrollDirection, scrollDirection);
      let currentCenter = vec3.clone(centerPosition);
      originalOrientation = quat.clone(view.orientation);
      lookAt(cameraPosition, cursorPos);
      targetOrientation = quat.clone(view.orientation);
      lookAt(cameraPosition, currentCenter);

      lastScrollX = nx;
      lastScrollY = ny;
      scrollT = 0;
      lastScrollTime = now;
    }

    if (scrollT < 1) {
      quat.slerp(scrollRotation, originalOrientation, targetOrientation, scrollT);
      quat.set(view.orientation, scrollRotation[0], scrollRotation[1], scrollRotation[2], scrollRotation[3]);
      scrollT += 0.01;
    }
    cameraPosition[0] += moveSpeed * scaleFactor * scrollDirection[0];
    cameraPosition[1] += moveSpeed * scaleFactor * scrollDirection[1];
    cameraPosition[2] += moveSpeed * scaleFactor * scrollDirection[2];

    commitMatrixChanges();

    e.preventDefault();
  }

  function getScaleFactorFromDelta(delta) {
    return Math.sign(delta) * Math.min(0.25, Math.abs(delta / 128));
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    let dy = e.touches[0].clientY - mouseY;
    let dx = e.touches[0].clientX - mouseX;
    updateLookAtByOffset(-dx, dy);
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    e.preventDefault();
  }

  function onMouseMove(e) {
    let dy = e.clientY - mouseY;
    let dx = e.clientX - mouseX;
    updateLookAtByOffset(-dx, -dy);
    mouseX = e.clientX;
    mouseY = e.clientY;
    e.preventDefault();
  }

  function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function onPointerLockChange(e) {
    if (document.pointerLockElement) {
      document.addEventListener('mousemove', handleMousePositionChange, false);
    } else {
      document.removeEventListener('mousemove', handleMousePositionChange, false);
      // Stop any residual movements:
      dPhi = 0;
      dIncline = 0;
    }
  }

  function handleMousePositionChange(e) {
    // This handler only called when pointer is locked.
    updateLookAtByOffset(e.movementX, -e.movementY)
    // if left button is down, also add a line:
    if (e.buttons & 1) {
      notifyLineAdded();
    }
  }

  function updateLookAtByOffset(dx, dy) {
    let dYaw = (rotationSpeed * dx) / drawContext.width;
    let dPitch = (inclinationSpeed * dy) / drawContext.height;
    rotateBy(dYaw, dPitch);
    commitMatrixChanges();
  }

  function enableMouseCapture(isLocked) { 
    captureMouse = isLocked; 
    return api; 
  }

  function onKey(e, isDown) {
    if (isModifierKey(e)) {
      // remove the move down if modifier was pressed after shift
      vz = 0;
      return;
    }
    let command = keyMap[e.which];
    if (command) handleCommand(command, isDown)
  }

  function handleCommand(commandId, value) {
    switch (commandId) {
      case INPUT_COMMANDS.MOVE_FORWARD:
        vy = value; break;
      case INPUT_COMMANDS.MOVE_BACKWARD:
        vy = -value; break;
      case INPUT_COMMANDS.MOVE_LEFT:
        vx = value; break;
      case INPUT_COMMANDS.MOVE_RIGHT:
        vx = -value; break;
      case INPUT_COMMANDS.MOVE_UP:
        vz = -value; break;
      case INPUT_COMMANDS.MOVE_DOWN:
        vz = value; break;

      case INPUT_COMMANDS.TURN_LEFT:
        vPhi = -value; break;
      case INPUT_COMMANDS.TURN_RIGHT:
        vPhi = value; break;
      case INPUT_COMMANDS.TURN_UP:
        vIncline = value; break;
      case INPUT_COMMANDS.TURN_DOWN:
        vIncline = -value; break;

      default: {
        throw new Error('Unknown command ' + commandId);
      }
    }

    processNextInput();
  }

  function processNextInput() {
    if (frameHandle) return; // already scheduled
    frameHandle = requestAnimationFrame(frame);
  }

  function setViewBox(rect) {
    const dpr = drawContext.pixelRatio;
    const nearHeight = dpr * Math.max((rect.top - rect.bottom)/2, (rect.right - rect.left) / 2);
    let x = (rect.left + rect.right)/2;
    let y = (rect.top + rect.bottom)/2;
    let z = nearHeight / Math.tan(drawContext.fov / 2);
    lookAt([x, y, z], [x, y, 0]);
    return api;
  }

  function frame() {
    frameHandle = 0;
    let dampFactor = 0.9;
    let needRedraw = false;

    dx = clampTo(dx * dampFactor + vx, 0.5, 0);
    dy = clampTo(dy * dampFactor + vy, 0.5, 0);
    dz = clampTo(dz * dampFactor + vz, 0.5, 0);
    dPhi = clampTo((dPhi * dampFactor + vPhi/2), Math.PI/360, 0);
    dIncline = clampTo((dIncline * dampFactor + vIncline/6), Math.PI/360, 0);

    if (dx || dy) {
      moveCenterBy(dx * moveSpeed, dy * moveSpeed);
      needRedraw = true;
    }
    if (dz) {
      cameraPosition[2] += dz * flySpeed;
      needRedraw = true;
    }
    if (dIncline || dPhi) {
      rotateBy(dPhi*0.01, dIncline*0.01);
      needRedraw = true;
    }

    if (needRedraw) {
      commitMatrixChanges();
      processNextInput();
    }
    moveState[INPUT_COMMANDS.MOVE_LEFT] = dx > 0;
    moveState[INPUT_COMMANDS.MOVE_RIGHT] = dx < 0;
    moveState[INPUT_COMMANDS.MOVE_FORWARD] = dy > 0;
    moveState[INPUT_COMMANDS.MOVE_BACKWARD] = dy < 0;
    moveState[INPUT_COMMANDS.MOVE_UP] = dz > 0;
    moveState[INPUT_COMMANDS.MOVE_DOWN] = dz < 0;
    moveState[INPUT_COMMANDS.TURN_LEFT] = dPhi < 0;
    moveState[INPUT_COMMANDS.TURN_RIGHT] = dPhi > 0;
    api.fire('move', moveState);
  }

  function lookAt(eye, center) {
    vec3.set(cameraPosition, eye[0], eye[1], eye[2]);
    vec3.set(centerPosition, center[0], center[1], center[2]);

    mat4.targetTo(view.cameraWorld, cameraPosition, centerPosition, upVector);
    mat4.getRotation(view.orientation, view.cameraWorld);
    mat4.invert(view.matrix, view.cameraWorld);
    commitMatrixChanges();
    return api;
  }

  function getUpVector() {
    return upVector;
  }

  function commitMatrixChanges() {
    view.update();
    vec3.transformMat4(centerPosition, FRONT_VECTOR, view.cameraWorld);
  }

  function rotateBy(yaw, pitch) {
    // Note order here is important: 
    // https://gamedev.stackexchange.com/questions/30644/how-to-keep-my-quaternion-using-fps-camera-from-tilting-and-messing-up/30669
    if (yaw) {
      quat.mul(view.orientation, quat.setAxisAngle([0, 0, 0, 0], FRONT_VECTOR, yaw), view.orientation);
      // Wanna make sure that device orientation based API is updated after this too
      // deviceOrientationHandler.useCurrentOrientation();
    }
    if (pitch) quat.mul(view.orientation, view.orientation, quat.setAxisAngle([0, 0, 0, 0], [1, 0, 0], pitch));
  }

  function moveCenterBy(dx, dy) {
    // TODO: this slow downs when camera looks directly down.
    // The `dy` is in `z` coordinate, because we are working with view matrix rotations
    // where z axis is going from the screen towards the viewer
    let delta = vec3.transformQuat([0, 0, 0], [-dx, 0, -dy], view.orientation);
    cameraPosition[0] += delta[0];
    cameraPosition[1] += delta[1];
  }

  function dispose() {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    inputTarget.removeEventListener('keydown', handleKeyDown);
    inputTarget.removeEventListener('keyup', handleKeyUp);
    inputTarget.removeEventListener('mousedown', handleMouseDown);

    inputTarget.removeEventListener('touchmove', handleTouchMove);
    inputTarget.removeEventListener('touchstart', handleTouchStart);
    inputTarget.removeEventListener('wheel', handleWheel);

    document.removeEventListener('mousemove', handleMousePositionChange, false);
    document.removeEventListener('pointerlockchange', onPointerLockChange, false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

function option(value, fallback) {
    if (value === undefined) return fallback;
    return value;
}

function clampTo(x, threshold, clampValue) {
    return Math.abs(x) < threshold ? clampValue : x;
}

function isModifierKey(e) {
    return e.altKey || e.ctrlKey || e.metaKey;
}