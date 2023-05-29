import ViewMatrix from './viewMatrix.js';
import createMapInputController from './input.js';
import createMovingLinesCollection from './createMovingLinesCollection.js';
import createVectorFieldCalculator from './createVectorFieldComputeShader.js';
const canvas = document.querySelector('canvas');
const seededRandom = ngraphRandom(42);

function random() {
    return seededRandom.nextDouble();
}

const dt = 0.01;
const field = `
fn getVelocityAtPoint(pos: vec4f) -> vec4f {
    let x = pos.x;
    let y = pos.y;
    let z = pos.z;
    let w = pos.w;
    return vec4f(10 * (y - x), x * (28 - z) - y, x * y - 1.5*w, (x-y)+z);
}`
document.querySelector('textarea').value = field;
document.querySelector('#updateButton').addEventListener('click', (e) => {
    const field = document.querySelector('textarea').value;
    document.querySelector('#error').textContent = '';
    try {
        vectorFieldCalculator.setNewField(field);
        // when alt key is pressed, also reset the lines:
        if (e.altKey) {
            device.queue.writeBuffer(movingLinesCollection.lineCoordinates, 0, lineCoordinatesArray);
        }
    } catch (e) {
        document.querySelector('#error').textContent = e.message;
    }
});
// canvas.width = size;
// canvas.height = size;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const drawContext = {
    canvas,
    width: canvas.width,
    height: canvas.height,
    fov: 45 * Math.PI / 180,
    pixelRatio: window.devicePixelRatio || 1,
};

drawContext.view = new ViewMatrix(drawContext);
createMapInputController(drawContext);

const LINE_COUNT = 2000;
const POINT_DIMENSIONS = 4;
const SEGMENTS_PER_LINE = 100;
const POINTS_PER_LINE = POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1);

if (!navigator.gpu) {
    throw new Error('WebGPU not supported');
}
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error('Failed to get adapter');
}
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
const cnvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device,
    format: cnvasFormat
});

drawContext.cnvasFormat = cnvasFormat;
drawContext.device = device;

const mvpTypedArray = drawContext.view.modelViewProjection;
const mvpUniform = device.createBuffer({
    label: "mvp matrix",
    size: mvpTypedArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(mvpUniform, 0, mvpTypedArray);

const lineCoordinatesArray = new Float32Array(LINE_COUNT * POINTS_PER_LINE);
for (let i = 0; i < LINE_COUNT; i ++) {
    let lineStart = i * POINTS_PER_LINE;

    lineCoordinatesArray[lineStart]     = Math.cos(i / LINE_COUNT * Math.PI);
    lineCoordinatesArray[lineStart + 1] = Math.sin(i / LINE_COUNT * Math.PI);
    lineCoordinatesArray[lineStart + 2] = 0.1;
    lineCoordinatesArray[lineStart + 3] = .1;
    // for (let j = 0; j < POINTS_PER_LINE; j += POINT_DIMENSIONS) {
    //     lineCoordinatesArray[lineStart + j]     = (random() - 0.5) * 2;
    //     lineCoordinatesArray[lineStart + j + 1] = (random() - 0.5) * 2;
    //     lineCoordinatesArray[lineStart + j + 2] = (random() - 0.5) * 2;
    //     lineCoordinatesArray[lineStart + j + 3] = (random() - 0.5) * 2;
    // }
}

let movingLinesCollection = createMovingLinesCollection(drawContext, 
    LINE_COUNT, SEGMENTS_PER_LINE,
    mvpUniform,
    lineCoordinatesArray);
let vectorFieldCalculator = createVectorFieldCalculator(drawContext,
    LINE_COUNT, SEGMENTS_PER_LINE,
    movingLinesCollection.lineCoordinates,
    movingLinesCollection.lineLifeCycle,
    {
        dt, 
        field
    });

let gridLines = createGridLines(-10, -10, 10, 10 )

let step = 0;
let hitchTheRide = false;
// drawContext.view.position = [1, 1, 1.0];

function updateGrid() {
    step += 1;
    if (hitchTheRide) {
        updateCameraPositionAccordingToTheField();
    }

    if (drawContext.view.updated) {
        // console.log(drawContext.view);
        device.queue.writeBuffer(mvpUniform, 0, mvpTypedArray);
        drawContext.view.updated = false;
    }

    const encoder = device.createCommandEncoder();

    vectorFieldCalculator.updatePositions(encoder);

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            // clearValue: [0, 0.4, 1, 1],
            clearValue: [0., 0., 0, 1],
            storeOp: 'store',
        }]
    });

    gridLines.draw(pass);
    movingLinesCollection.draw(pass);

    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(updateGrid);
}


// for (let i = 0; i < 1000; i ++) {
//     const encoder = device.createCommandEncoder();
//     vectorFieldCalculator.updatePositions(encoder);
//     device.queue.submit([encoder.finish()]);
// }

requestAnimationFrame(updateGrid);

function createGridLines(left, bottom, right, top) {
    let gridLines = [];
    let x = left;
    let lineCount = 0;
    while (x <= right) {
        gridLines.push(
            x, bottom, 0, 0,
            x, bottom, 0, 0,
            x, top, 0, 0
        );
        x += 1;
        lineCount += 1;
    }
    let y = bottom;
    while (y <= top) {
        gridLines.push(
            left, y,  0, 0,
            left, y,  0, 0,
            right, y, 0, 0
        );
        y += 1;
        lineCount += 1;
    }
    let typedArray = new Float32Array(gridLines);
    let collection = createMovingLinesCollection(drawContext, 
        lineCount, 2,
        mvpUniform,
        typedArray,
        [.1, 0.15, .3, 1]);   
    let lifeCycle = new Float32Array(lineCount * 2);
    for (let i = 0; i < lineCount; i ++) {
        lifeCycle[i*2] = 0;
        lifeCycle[i*2+1] = 2;
    }
    device.queue.writeBuffer(collection.lineLifeCycle, 0, lifeCycle);
    return collection;
}

function updateCameraPositionAccordingToTheField() {
    let pos = drawContext.view.position;
    let nextPos = rk4(vec3f(pos[0], pos[1], pos[2]), dt);
    drawContext.view.position = [nextPos.x, nextPos.y, nextPos.z];
    drawContext.view.update();
}

function rk4(x, dt) {
    let k1 = getVelocityAtPoint(x);
    let k2 = getVelocityAtPoint(vec3f(x.x + k1.x * dt / 2, x.y + k1.y * dt / 2, x.z + k1.z * dt / 2));
    let k3 = getVelocityAtPoint(vec3f(x.x + k2.x * dt / 2, x.y + k2.y * dt / 2, x.z + k2.z * dt / 2));
    let k4 = getVelocityAtPoint(vec3f(x.x + k3.x * dt, x.y + k3.y * dt, x.z + k3.z * dt));
    return vec3f(x.x + (k1.x + 2*k2.x + 2*k3.x + k4.x) * dt / 6,
        x.y + (k1.y + 2*k2.y + 2*k3.y + k4.y) * dt / 6,
        x.z + (k1.z + 2*k2.z + 2*k3.z + k4.z) * dt / 6
    );
}

function getVelocityAtPoint(pos) {
    let x = pos.x;
    let y = pos.y;
    let z = pos.z;
    let sigma = 10.0;
    return vec3f(-y, x, 0);
    return vec3f(sigma*(y-x), x*(28.0-z)-y, x*y-8.0/3.0*z);
}

function vec3f(x, y, z) {
    return {x, y, z};
}