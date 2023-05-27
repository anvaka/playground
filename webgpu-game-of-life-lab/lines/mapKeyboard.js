function createKeyboardController(inputTarget, camera) {
    let frameHandle = 0;

    let vx = 0, vy = 0, vz = 0; // velocity of the panning
    let dx = 0, dy = 0, dz = 0; // actual offset of the panning
    let dPhi = 0, vPhi = 0; // rotation 
    let dRadius = 0, vRadius = 0; // radius
    let dIncline = 0, vIncline = 0; // inclination

    listenToEvents();

    return { dispose };

    function listenToEvents() {
        if (!inputTarget.getAttribute('tabindex')) {
            inputTarget.setAttribute('tabindex', '0');
        }
        inputTarget.addEventListener('keydown', handleKeyDown);
        inputTarget.addEventListener('keyup', handleKeyUp);
    }

    function dispose() {
        inputTarget.removeEventListener('keydown', handleKeyDown);
        inputTarget.removeEventListener('keyup', handleKeyUp);
        cancelAnimationFrame(frameHandle);
    }

    function frame() {
        frameHandle = 0;
        let dampFactor = 0.9;
        let needRedraw = false;

        dx = clampTo(dx * dampFactor + vx, 0.5, 0);
        dy = clampTo(dy * dampFactor + vy, 0.5, 0);
        dz = clampTo(dz * dampFactor + vz, 0.5, 0);
        if (dx || dy) {
            camera.panByAbsoluteOffset(dx, dy);
            needRedraw = true;
        }
        if (dz) {
            camera.slideCenterUpDown(dz);
            needRedraw = true;
        }

        dPhi = clampTo((dPhi * dampFactor + vPhi / 2), Math.PI / 360, 0);
        dIncline = clampTo((dIncline * dampFactor + vIncline / 6), Math.PI / 360, 0);
        if (dPhi || dIncline) {
            camera.rotateByAbsoluteOffset(dPhi, dIncline);
            needRedraw = true;
        }

        dRadius = clampTo((dRadius * 0.7 + vRadius), 0.5, 0);
        if (dRadius) {
            let scaleFactor = Math.sign(dRadius) * 0.025;
            camera.zoomCenterByScaleFactor(scaleFactor, 0, 0);
            needRedraw = true;
        }

        if (needRedraw) {
            camera.redraw();
            processNextInput();
        }
    }

    function processNextInput() {
        if (frameHandle) return; // already scheduled
        frameHandle = requestAnimationFrame(frame);
    }

    function handleKeyDown(e) {
        onKey(e, 1);
    }

    function handleKeyUp(e) {
        onKey(e, 0);
    }

    function onKey(e, isDown) {
        if (isModifierKey(e)) return;

        // TODO: implement plane move on the z up/down?
        switch (e.which) {
            case 81: // q - roll right
                vPhi = -isDown;
                break;
            case 69: // e - roll left
                vPhi = isDown;
                break;
            case 187: // + - zoom in
                vRadius = isDown;
                break;
            case 189: // - - zoom in
                vRadius = -isDown;
                break;
            case 82: // r - incline up
                vIncline = isDown;
                break;
            case 70: // f - incline down
                vIncline = -isDown;
                break;
            case 37: // ←
            case 65: // a
                vx = isDown;
                break;
            case 39: // →
            case 68: // d
                vx = -isDown;
                break;
            case 38: // ↑
            case 87: // w
                vy = isDown;
                break;
            case 40: // ↓
            case 83: // s
                vy = -isDown;
                break;
            case 71: // g
                vz = -isDown;
                break;
            case 84: // t
                vz = isDown;
                break;
        }
        processNextInput();
    }
}

function createCamera(drawContext) {
    let rotationSpeed = Math.PI * 2;
    let inclinationSpeed = Math.PI * 1.618;

    let sceneOptions = {};
    let allowRotation = sceneOptions.allowRotation === undefined ? true : !!sceneOptions.allowRotation;
    let allowPinchRotation = sceneOptions.allowPinchRotation === undefined ? allowRotation : !!sceneOptions.allowPinchRotation;

    // angle of rotation around Y axis, tracked from axis X to axis Z
    let minPhi = option(sceneOptions.minPhi, -Infinity);
    let maxPhi = option(sceneOptions.maxPhi, Infinity);
    // Rotate the camera so it looks to the central point in Oxy plane from distance r.
    let phi = clamp(-Math.PI / 2, minPhi, maxPhi);

    // camera inclination angle. (Angle above Oxz plane)
    let minTheta = option(sceneOptions.minTheta, 0);
    let maxTheta = option(sceneOptions.maxTheta, Math.PI);
    let theta = clamp(0, minTheta, maxTheta);

    // Distance to the point at which our camera is looking
    let minR = option(sceneOptions.minZoom, -Infinity);
    let maxR = option(sceneOptions.maxZoom, Infinity);
    let r = clamp(1, minR, maxR);

    const {view} = drawContext;
    let centerPointPosition = view.center;
    let cameraPosition = view.position;

    let planeNormal = [0, 0, 1];
    return {
        panByAbsoluteOffset,
        slideCenterUpDown,
        rotateByAbsoluteOffset,
        zoomCenterByScaleFactor,
        redraw
    }

    function panByAbsoluteOffset(dx, dy) {
        let ar = drawContext.width / drawContext.height;
        // the idea behind this formula is this. We turn dx and dy to be
        // in a range from [0..1] (as a ratio of the screen width or height),
        // We know the FoV angle, we want to know how much of the distance we
        // traveled on the frustrum plane.
        // Distance to frustrum is `r`, thus half length of the frustrum plane
        // is `r * tan(fov/2)`, we now extend it to full length by performing `2 * `
        // and take the ratio in dx and dy scale.
        let fCoefficient = 2 * r * Math.tan(drawContext.fov / 2);
        let x = (ar * fCoefficient * dx) / (drawContext.width / drawContext.pixelRatio);
        let y = (fCoefficient * dy) / (drawContext.height / drawContext.pixelRatio);
        moveCenterBy(x, -y); // WebGL Y is not the same as typical DOM Y.
    }

    function moveCenterBy(dx, dy) {
        let cPhi = Math.cos(phi);
        let sPhi = Math.sin(phi);
        centerPointPosition[0] += cPhi * dy + sPhi * dx;
        centerPointPosition[1] += sPhi * dy - cPhi * dx;
    }

    function slideCenterUpDown(dz) {
        centerPointPosition[2] += dz * r * 0.001;
    }

    function rotateByAbsoluteOffset(dx, dy) {
        if (!allowRotation) return;

        let ar = drawContext.width / drawContext.height;

        phi -= (rotationSpeed * dx) / drawContext.width;
        theta -= ((inclinationSpeed * dy) / drawContext.height) * ar;

        theta = clamp(theta, minTheta, maxTheta);
        phi = clamp(phi, minPhi, maxPhi);
    }
    function zoomCenterByScaleFactor(scaleFactor, dx, dy) {
        // `scaleFactor` defines whether we shrink the radius by multiplying it by something < 1
        // or increase it by multiplying by something > 1.
        let newR = clamp(r * (1 - scaleFactor), minR, maxR);
        if (newR === r) return;

        r = newR;
        // let's also move the center closer to the scrolling origin, this gives
        // better UX, similar to the one seen in maps: Map zooms into point under
        // mouse cursor.

        // How much should we move the center point?
        // (dx, dy) is current distance from the scroll point to the center. We should
        // keep it the same after we scaled!
        // dXScaled = dx * (1 - scaleFactor); // this is going to be the distance after we scaled.
        // newOffsetX = dx - dXScaled; // Thus we move the center by this amount. Which is the same as:
        // newOffsetX = dx - dx * (1 - scaleFactor) == dx * (1 - 1 + scaleFactor) == dx * scaleFactor;
        // Thus the formula below:
        centerPointPosition[0] += dx * scaleFactor;
        centerPointPosition[1] += dy * scaleFactor;
    }
    function redraw() {
        let newCameraPosition = getSpherical(r, theta, phi);

        // We want to know what is an up vector? The idea is that its position
        // can also be represented in spherical coordinates of a sphere with slightly larger
        // radius. How much larger?
        // Just assume `up` vector length is 1, then the sphere  radius is sqrt(r * r + 1 * 1):
        let upVectorSphereRadius = Math.hypot(r, 1); // Note: may run into precision error here.

        // We know a hypotenuse of the new triangle and its size. The angle would be
        // `Math.acos(r/upVectorSphereRadius)`, and since we don't care whether up is above or below
        // the actual `theta`, we pick one direction and stick to it:
        let upVectorTheta = theta - Math.acos(r / upVectorSphereRadius);
        // The rotation angle around z axis (phi) is the same as the camera position.
        let upVector = getSpherical(upVectorSphereRadius, upVectorTheta, phi);

        // Finally we know both start of the upVector, and the end of the up vector, let's find the direction:
        vec3.sub(upVector, upVector, newCameraPosition);

        vec3.set(
            cameraPosition,
            newCameraPosition[0],
            newCameraPosition[1],
            newCameraPosition[2]
        );
        vec3.add(cameraPosition, cameraPosition, centerPointPosition);

        // I'd assume this could be simplified? I just don't know and haven't thought yet how:
        mat4.targetTo(view.cameraWorld, cameraPosition, centerPointPosition, upVector);
        mat4.getRotation(view.orientation, view.cameraWorld);
        view.update();
    }
}