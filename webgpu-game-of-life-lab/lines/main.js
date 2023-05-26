const canvas = document.querySelector('canvas');
const size = Math.min(window.innerWidth, window.innerHeight)
canvas.width = size;
canvas.height = size;
const LINE_COUNT = 2;
const POINT_DIMENSIONS = 3;
const SEGMENTS_PER_LINE = 30;
const TOTAL_LINES = LINE_COUNT * SEGMENTS_PER_LINE;
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

const lineStateArray = new Float32Array(LINE_COUNT * POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1));
const lineStateStorage = device.createBuffer({
    label: "Line state A",
    size: lineStateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

for (let i = 0; i < lineStateArray.length; i += 2) {
    lineStateArray[i] =  0;//Math.sin(i*2);
    lineStateArray[i + 1] = 0;//Math.cos(i*2);
}

lineStateArray[0*POINTS_PER_LINE + 0*0 + 0] = 0;
lineStateArray[0*POINTS_PER_LINE + 0*0 + 1] = 0;
lineStateArray[0*POINTS_PER_LINE + 1*2 + 0] = 1;
lineStateArray[0*POINTS_PER_LINE + 1*2 + 1] = 0;
lineStateArray[0*POINTS_PER_LINE + 2*2 + 0] = 1;
lineStateArray[0*POINTS_PER_LINE + 2*2 + 1] = 1;
lineStateArray[0*POINTS_PER_LINE + 3*2 + 0] = 0;
lineStateArray[0*POINTS_PER_LINE + 3*2 + 1] = 1;

lineStateArray[1 * POINTS_PER_LINE + 0*0 + 0] = 1.1 + 0;
lineStateArray[1 * POINTS_PER_LINE + 0*0 + 1] = 0 + 0;
lineStateArray[1 * POINTS_PER_LINE + 1*2 + 0] = 1.1 + 1;
lineStateArray[1 * POINTS_PER_LINE + 1*2 + 1] = 0 + 0;
lineStateArray[1 * POINTS_PER_LINE + 2*2 + 0] = 1.1 + 1;
lineStateArray[1 * POINTS_PER_LINE + 2*2 + 1] = 0 + 1;
lineStateArray[1 * POINTS_PER_LINE + 3*2 + 0] = 1.1 + 0;
lineStateArray[1 * POINTS_PER_LINE + 3*2 + 1] = 0 + 1;

lineStateArray[2 * POINTS_PER_LINE + 0*0 + 0] = 0;
lineStateArray[2 * POINTS_PER_LINE + 0*0 + 1] = 0 + 1.1;
lineStateArray[2 * POINTS_PER_LINE + 1*2 + 0] = 1;
lineStateArray[2 * POINTS_PER_LINE + 1*2 + 1] = 0 + 1.1;
lineStateArray[2 * POINTS_PER_LINE + 2*2 + 0] = 1;
lineStateArray[2 * POINTS_PER_LINE + 2*2 + 1] = 1 + 1.1;
lineStateArray[2 * POINTS_PER_LINE + 3*2 + 0] = 0;
lineStateArray[2 * POINTS_PER_LINE + 3*2 + 1] = 1 + 1.1;
console.log(lineStateArray, LINE_COUNT * POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1));
device.queue.writeBuffer(lineStateStorage, 0, lineStateArray);

const lineLifeCycleArray = new Uint32Array(LINE_COUNT * 2);
const lineLifeCycleStorage = device.createBuffer({
    label: "Line life cycle",
    size: lineLifeCycleArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
for (let i = 0; i < lineLifeCycleArray.length; i += 2) {
    lineLifeCycleArray[i] = 0; // head of the segment.
    lineLifeCycleArray[i + 1] = 0; // how many vertices already rendered.
}

let h = 3;
lineLifeCycleArray[0] = h; // Last vertex number rendered.
lineLifeCycleArray[0 + 1] = 3; // how many segments already rendered.

lineLifeCycleArray[2] = h; // Last vertex number rendered.
lineLifeCycleArray[2 + 1] = 3; // how many segments already rendered.

lineLifeCycleArray[4] = h; // Last vertex number rendered.
lineLifeCycleArray[4 + 1] = 3; // how many segments already rendered.
device.queue.writeBuffer(lineLifeCycleStorage, 0, lineLifeCycleArray);

let mat4 = glMatrix.mat4;
const projectionMatrix = mat4.create();
glMatrix.mat4.perspective(projectionMatrix, 45 * Math.PI / 180, 1, 0.1, 100);

// Set up the camera parameters
let eye = [0, 2.5, 2.5];    // Camera position
let target = [0, 0, 0]; // Target position
let up = [0, 1, 0];     // Up vector

// Create an identity matrix to store the view matrix
let viewMatrix = mat4.create();

// Use the lookAt() method to construct the view matrix
mat4.lookAt(viewMatrix, eye, target, up);
const modelViewProjectionMatrix = mat4.create();
mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
const mvpTypedArray = new Float32Array(modelViewProjectionMatrix);

const uniformBuffer = device.createBuffer({
    label: "mvp matrix",
    size: mvpTypedArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, mvpTypedArray);

const vertices = new Float32Array([
    -0.5, 0, -0.5, 1, 0.5, 1, // First 2D triangle of the quad
    -0.5, 0, 0.5, 1, 0.5, 0   // Second 2D triangle of the quad
]);
const vertexBuffer = device.createBuffer({
    label: "Line vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);
const vertexBufferLayout = {
    // number of bytes the GPU needs to skip forward in the buffer when it's
    // looking for the next vertex.
    arrayStride: 2 * 4, 
    attributes: [{
        format: 'float32x2',
        offset: 0,
        shaderLocation: 0,
    }]
};

const lineShaderModule = device.createShaderModule({
    label: "Line shader",
    code: `
@group(0) @binding(0) var<uniform> modelViewProjection: mat4x4<f32>;
@group(0) @binding(1) var<storage> lineCoordinates: array<f32>;
@group(0) @binding(2) var<storage> lineLife: array<u32>;

struct VertexInput {
    @location(0) pos: vec2<f32>,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) @interpolate(flat) instance: u32,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var i = input.instance;
    var output: VertexOutput;

    var lineIndex = u32(floor(f32(i) / f32(${SEGMENTS_PER_LINE})));
    var lineStart = lineIndex * ${POINTS_PER_LINE };
    var head = lineLife[lineIndex * 2 + 0];
    var length = lineLife[lineIndex * 2 + 1];
    i = i % ${SEGMENTS_PER_LINE };
    var start = (head - length + i + ${SEGMENTS_PER_LINE + 1}) % (${SEGMENTS_PER_LINE + 1});

    var width = .05 * f32(i) / ${SEGMENTS_PER_LINE };
    var startIndex = lineStart + (start * ${POINT_DIMENSIONS});
    var endIndex = lineStart + ((start + 1) * ${POINT_DIMENSIONS}) % (${POINTS_PER_LINE});
    var startPos = vec3(lineCoordinates[startIndex + 0], lineCoordinates[startIndex + 1], lineCoordinates[startIndex + 2]);
    var endPos = vec3(lineCoordinates[(endIndex + 0)], lineCoordinates[endIndex + 1], lineCoordinates[endIndex + 2]);
    let xDir = normalize(endPos - startPos);
    let yDir = vec2(-xDir.y, xDir.x);
    let clip0 = modelViewProjection * vec4(startPos.xy + width * yDir * input.pos.x, startPos.z, 1);
    let clip1 = modelViewProjection * vec4(endPos.xy + width * yDir * input.pos.x, endPos.z, 1);
    output.pos = mix(clip0, clip1, input.pos.y);
    // output.instance = lineIndex;
    output.instance = 1;
    return output;
}
// @location(0) indicates which colorAttachment (specified in 
// beginRenderPass) to output to.
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    var color = vec4f(0, 0, 0, 1);
    color[input.instance] = 1;
    return color;
}`});

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: 'auto',
    vertex: {
        module: lineShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: lineShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: cnvasFormat
        }]
    },
});

const bindGroup = device.createBindGroup({
    label: 'Line render bind group',
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: {
            buffer: uniformBuffer,
        }
    }, {
        binding: 1,
        resource: {
            buffer: lineStateStorage,
        } 
    }, 
    {
        binding: 2,
        resource: {
            buffer: lineLifeCycleStorage,
        } 
    }
]
})

const UPDATE_INTERVAL = 20;
let step = 0;

function updateGrid() {
    step += 1;


    let x = Math.sin( step / 20);
    let y = Math.cos( step / 20);
    lineLifeCycleArray[0] = (lineLifeCycleArray[0] + 1) % (SEGMENTS_PER_LINE+ 1);
    lineLifeCycleArray[1] = Math.min(1 + lineLifeCycleArray[1], SEGMENTS_PER_LINE);
    lineStateArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 0] = x;
    lineStateArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 1] = y;
    lineStateArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 2] = 0;

    lineLifeCycleArray[2] = (lineLifeCycleArray[2] + 1) % (SEGMENTS_PER_LINE+ 1);
    lineLifeCycleArray[3] = Math.min(1 + lineLifeCycleArray[3], SEGMENTS_PER_LINE);

    lineStateArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 0)+POINTS_PER_LINE] = x + 1.5;
    lineStateArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 1)+POINTS_PER_LINE] = 0;
    lineStateArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 2)+POINTS_PER_LINE] = y;

    device.queue.writeBuffer(lineLifeCycleStorage, 0, lineLifeCycleArray);
    device.queue.writeBuffer(lineStateStorage, 0, lineStateArray);

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0, 0.4, 1, 1],
            storeOp: 'store',
        }]
    });

    pass.setPipeline(cellPipeline);
    // 0 because this vertexBuffer corresponds to the first
    // vertexBufferLayout.attributes in the pipeline.
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(vertices.length / 2, LINE_COUNT * (SEGMENTS_PER_LINE));
    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(updateGrid);
}

requestAnimationFrame(updateGrid);