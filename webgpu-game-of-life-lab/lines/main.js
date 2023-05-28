import ViewMatrix from './viewMatrix.js';
import createMapInputController from './input.js';
import createMovingLinesCollection from './createMovingLinesCollection.js';
import createVectorFieldCalculator from './createVectorFieldComputeShader.js';
const canvas = document.querySelector('canvas');
const seededRandom = ngraphRandom(42);

function random() {
    return seededRandom.nextDouble();
}

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

const LINE_COUNT = 1000;
const POINT_DIMENSIONS = 3;
const SEGMENTS_PER_LINE = 10;
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
    for (let j = 0; j < POINTS_PER_LINE; j += POINT_DIMENSIONS) {
        lineCoordinatesArray[lineStart + j] = random()*2 - 1;
        lineCoordinatesArray[lineStart + j + 1] = random()*2 - 1;
        lineCoordinatesArray[lineStart + j + 2] = random();
    }
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
        dt: 0.01
    });

let step = 0;

function updateGrid() {
    step += 1;
    // console.log(step);
    // let viewMatrix = mat4.create();

    // eye[0] = 20 * Math.sin(step/100);
    // eye[2] = 14 * Math.cos(step/100);
    // // Use the lookAt() method to construct the view matrix
    // mat4.lookAt(viewMatrix, eye, target, up);
    // mat4.multiply(mvpTypedArray, projectionMatrix, viewMatrix);
    // // mvpTypedArray = new Float32Array(modelViewProjectionMatrix);
    // device.queue.writeBuffer(mvpUniform, 0, mvpTypedArray);

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

    movingLinesCollection.draw(pass);

    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(updateGrid);
}

requestAnimationFrame(updateGrid);
