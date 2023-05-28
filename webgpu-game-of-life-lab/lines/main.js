import ViewMatrix from './viewMatrix.js';
import createMapInputController from './input.js';
const canvas = document.querySelector('canvas');
const size = Math.min(window.innerWidth, window.innerHeight)
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

const globalGridSize = 8;
const dt = 0.05;
const LINE_COUNT = 200;
const POINT_DIMENSIONS = 3;
const SEGMENTS_PER_LINE = 10;
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

const lineCoordinatesArray = new Float32Array(LINE_COUNT * POINTS_PER_LINE);
const lineCoordinates = device.createBuffer({
    label: "Line coordinates",
    size: lineCoordinatesArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

for (let i = 0; i < LINE_COUNT; i ++) {
    let lineStart = i * POINTS_PER_LINE;
    for (let j = 0; j < POINTS_PER_LINE; j += POINT_DIMENSIONS) {
        lineCoordinatesArray[lineStart + j] = random()*2 - 1;
        lineCoordinatesArray[lineStart + j + 1] = random()*2 - 1;
        lineCoordinatesArray[lineStart + j + 2] = random();
    }
}

// lineCoordinatesArray[0 + 0] = 2;
// lineCoordinatesArray[0 + 0 + 1] = 2;
// lineCoordinatesArray[0 + 0 + 2] = 0.1;
device.queue.writeBuffer(lineCoordinates, 0, lineCoordinatesArray);

const lineLifeCycleArray = new Uint32Array(LINE_COUNT * 2);
const lineLifeCycleStorage = device.createBuffer({
        label: 'Line life cycle A',
        size: lineLifeCycleArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

for (let i = 0; i < lineLifeCycleArray.length; i += 2) {
    lineLifeCycleArray[i] = 0;
    lineLifeCycleArray[i + 1] = 0;
}

// device.queue.writeBuffer(lineLifeCycleStorage[0], 0, lineLifeCycleArray);

// let mat4 = glMatrix.mat4;

// // Set up the camera parameters
// let eye = [0, 0, 14];    // Camera position
// let target = [0, 0, 0]; // Target position
// let up = [0, 1, 0];     // Up vector

// // Create an identity matrix to store the view matrix
// let viewMatrix = mat4.create();

// // Use the lookAt() method to construct the view matrix
// mat4.lookAt(viewMatrix, eye, target, up);
// const modelViewProjectionMatrix = mat4.create();
// mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
const mvpTypedArray = drawContext.view.modelViewProjection;

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
@group(0) @binding(2) var<storage> lineLifeCycle: array<u32>;

struct VertexInput {
    @location(0) pos: vec2<f32>,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
};

fn rand(co: f32) -> f32 {
    let t = dot(vec3f(12.9898, 78.233, 4375.85453), vec3f(co));
    return fract(sin(t) * (4375.85453 + t));
}
@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var i = input.instance;
    var output: VertexOutput;

    var lineIndex = u32(floor(f32(i) / f32(${SEGMENTS_PER_LINE})));
    var lineStart = lineIndex * ${POINTS_PER_LINE };
    var head = lineLifeCycle[lineIndex * 2 + 0];
    var length = lineLifeCycle[lineIndex * 2 + 1];
    i = i % ${SEGMENTS_PER_LINE };
    if (i >= length) {
        output.pos = vec4<f32>(0, 0, 0, 1);
        output.color = vec4<f32>(0, 0, 0, 0);
        return output;
    }
    var start = (head - length + i + ${SEGMENTS_PER_LINE + 1}) % (${SEGMENTS_PER_LINE + 1});

    var width = 4.0 * (f32(i) / f32(${SEGMENTS_PER_LINE}));
    var startIndex = lineStart + (start * ${POINT_DIMENSIONS});
    var endIndex = lineStart + ((start + 1) * ${POINT_DIMENSIONS}) % (${POINTS_PER_LINE});
    var startPos = vec3(lineCoordinates[startIndex + 0], lineCoordinates[startIndex + 1], lineCoordinates[startIndex + 2]);
    var endPos = vec3(lineCoordinates[(endIndex + 0)], lineCoordinates[endIndex + 1], lineCoordinates[endIndex + 2]);

    let clip0 = modelViewProjection * vec4(startPos, 1);
    let clip1 = modelViewProjection * vec4(endPos, 1);
    let resolution = vec2f(${size});
    let screen0 = resolution * (0.5 * clip0.xy/clip0.w + 0.5);
    let screen1 = resolution * (0.5 * clip1.xy/clip1.w + 0.5);
    let xBasis = normalize(screen1 - screen0);
    let yBasis = vec2(-xBasis.y, xBasis.x);

    let pt0 = screen0 + width * input.pos.x * yBasis;
    let pt1 = screen1 + width * input.pos.x * yBasis;
    let pt = mix(pt0, pt1, input.pos.y);
    let clip = mix(clip0, clip1, input.pos.y);
    
    output.pos = vec4(clip.w * (2.0 * pt/resolution - 1.0), clip.z, clip.w);
    // output.instance = lineIndex;
    output.color = vec4(0.2, 0.4, .8, 0.7);
    return output;
}
// @location(0) indicates which colorAttachment (specified in 
// beginRenderPass) to output to.
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    return input.color;
    // var color = vec4f(0, 0, 0, .8);
    // color[input.instance] = 1;
    // return color;
}`});

const WORKGROUP_SIZE = 8;
const simulationShaderModule = device.createShaderModule({
    label: 'Flow simulation shader',
    code: `
    @group(0) @binding(0) var<storage, read_write> lineCoordinates: array<f32>;
    @group(0) @binding(1) var<storage, read_write> lineLifeCycle: array<u32>;

    fn getVelocityAtPoint(pos: vec3f) -> vec3f {
        let x = pos.x;
        let y = pos.y;
        let z = pos.z;
        //return vec3f(-cos(y), sin(z), cos(x) );
        //return vec3f(y, x, sin(x) * cos(y));
        return vec3f(-y, x,0);
    }

    fn rk4(pos: vec3f, dt: f32) -> vec3f {
        let k1 = getVelocityAtPoint(pos);
        let k2 = getVelocityAtPoint(pos + 0.5 * dt * k1);
        let k3 = getVelocityAtPoint(pos + 0.5 * dt * k2);
        let k4 = getVelocityAtPoint(pos + dt * k3);
        return pos + dt * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
    }

    fn rand(co: vec3f) -> f32 {
        let t = dot(vec3f(12.9898, 78.233, 4375.85453), co);
        return fract(sin(t) * (4375.85453 + t));
    }

    @compute
    @workgroup_size(${WORKGROUP_SIZE}) // , ${WORKGROUP_SIZE}, 1)
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
        let lineIndex = cell.x;// + cell.y * ${globalGridSize};
        if (lineIndex >= ${LINE_COUNT}) {
            return;
        }
        // first we get the last point in the line:
        var lineHead = lineLifeCycle[lineIndex * 2 + 0];
        var lineLength = lineLifeCycle[lineIndex * 2 + 1];
        var lastPosIndex = lineIndex * ${POINTS_PER_LINE} + lineHead * ${POINT_DIMENSIONS};
        var lastPos = vec3f(lineCoordinates[lastPosIndex + 0], lineCoordinates[lastPosIndex + 1], lineCoordinates[lastPosIndex + 2]);

        if (rand(lastPos * f32(lineIndex)) > 0.99) {
            lastPos = vec3f(rand(lastPos), rand(lastPos - 1), rand(lastPos + 1)) * 2.0 - 1.0;

            lastPosIndex = lineIndex * ${POINTS_PER_LINE} + (${SEGMENTS_PER_LINE} * ${POINT_DIMENSIONS});
            lineCoordinates[lastPosIndex + 0] = lastPos.x;
            lineCoordinates[lastPosIndex + 1] = lastPos.y;
            lineCoordinates[lastPosIndex + 2] = lastPos.z;
            lineLength = 0;
            lineHead = ${SEGMENTS_PER_LINE};
        }
        // now advance it:
        let newPos = rk4(lastPos, ${dt});
        // now we need to update the line:
        let newLength = clamp(1 + lineLength, 0, ${SEGMENTS_PER_LINE});
        let newPosIndex = lineIndex * ${POINTS_PER_LINE} + ((lineHead + 1) * ${POINT_DIMENSIONS}) % (${POINTS_PER_LINE});
        lineCoordinates[newPosIndex + 0] = newPos.x;
        lineCoordinates[newPosIndex + 1] = newPos.y;
        lineCoordinates[newPosIndex + 2] = newPos.z;

        lineLifeCycle[lineIndex * 2 + 0] = (lineHead + 1) % (${SEGMENTS_PER_LINE + 1});
        lineLifeCycle[lineIndex * 2 + 1] = newLength;

    }
    `
});


const computeBindGroupLayout = device.createBindGroupLayout({
    label: 'Flow simulation bind group layout',
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.COMPUTE ,
        buffer: {
            type: 'storage'
        }
    }, {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
            type: 'storage'
        }
    }]
});

const computePipelineLayout = device.createPipelineLayout({
    label: 'Flow simulation compute pipeline layout',
    bindGroupLayouts: [computeBindGroupLayout]
});

const simulationPipeline = device.createComputePipeline({
    label: 'Flow simulation pipeline',
    layout: computePipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: 'computeMain',
    }
});

const computeBindGroup = device.createBindGroup({
    label: 'Line render compute bind group A',
    layout: computeBindGroupLayout,
    entries: [{
        binding: 0,
        resource: { buffer: lineCoordinates, } 
    }, {
        binding: 1,
        resource: { buffer: lineLifeCycleStorage, } 
    }, 
]});

const renderBindGroupLayout = device.createBindGroupLayout({
    label: 'Flow simulation render bind group layout',
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' }
    }, {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' }
    }, {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' }
    }]
});

const renderPipelineLayout = device.createPipelineLayout({
    label: 'Flow simulation render pipeline layout',
    bindGroupLayouts: [renderBindGroupLayout]
});

const renderPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: renderPipelineLayout,
    vertex: {
        module: lineShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: lineShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: cnvasFormat,
            blend: {
                color: {
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                },
                alpha: {
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                },
            },
        }]
    },
});

const renderBindGroup = device.createBindGroup({
        label: 'Line render bind group B',
        layout: renderBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer, }
        }, {
            binding: 1,
            resource: { buffer: lineCoordinates, } 
        }, {
            binding: 2,
            resource: { buffer: lineLifeCycleStorage, } 
        }]
    })

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
    // device.queue.writeBuffer(uniformBuffer, 0, mvpTypedArray);

    if (drawContext.view.updated) {
        // console.log(drawContext.view);
        device.queue.writeBuffer(uniformBuffer, 0, mvpTypedArray);
        drawContext.view.updated = false;
    }

    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, computeBindGroup);
    const workgroupCount = Math.ceil(LINE_COUNT / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount);//, workgroupCount, 1);
    computePass.end();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            // clearValue: [0, 0.4, 1, 1],
            clearValue: [0., 0., 0, 1],
            storeOp: 'store',
        }]
    });

    pass.setPipeline(renderPipeline);
    // 0 because this vertexBuffer corresponds to the first
    // vertexBufferLayout.attributes in the pipeline.
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, renderBindGroup);
    pass.draw(vertices.length / 2, LINE_COUNT * SEGMENTS_PER_LINE);
    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(updateGrid);
}

requestAnimationFrame(updateGrid);
