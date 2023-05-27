const canvas = document.querySelector('canvas');
const size = Math.min(window.innerWidth, window.innerHeight)
canvas.width = size;
canvas.height = size;
const globalGridSize = 8;
const LINE_COUNT = globalGridSize * globalGridSize;
const POINT_DIMENSIONS = 3;
const SEGMENTS_PER_LINE = 3;
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

const lineCoordinatesArray = new Float32Array(LINE_COUNT * POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1));
const lineCoordinates = [
    device.createBuffer({
        label: "Line state A",
        size: lineCoordinatesArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Line state B",
        size: lineCoordinatesArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
]
for (let i = 0; i < LINE_COUNT; i ++) {
    let lineStart = i * POINTS_PER_LINE;
    for (let j = 0; j < POINTS_PER_LINE; j += POINT_DIMENSIONS) {
        lineCoordinatesArray[lineStart + j] = i;
        lineCoordinatesArray[lineStart + j + 1] = j/3;
        lineCoordinatesArray[lineStart + j + 2] = 0;
    }
}

device.queue.writeBuffer(lineCoordinates[0], 0, lineCoordinatesArray);

const lineLifeCycleArray = new Uint32Array(LINE_COUNT * 2);
const lineLifeCycleStorage = [
    device.createBuffer({
        label: 'Line life cycle A',
        size: lineLifeCycleArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Line life cycle B",
        size: lineLifeCycleArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
];
for (let i = 0; i < lineLifeCycleArray.length; i += 2) {
    lineLifeCycleArray[i] = 0;
    lineLifeCycleArray[i + 1] = 3;
}

// device.queue.writeBuffer(lineLifeCycleStorage[0], 0, lineLifeCycleArray);

let mat4 = glMatrix.mat4;
const projectionMatrix = mat4.create();
glMatrix.mat4.perspective(projectionMatrix, 45 * Math.PI / 180, 1, 0.1, 100);

// Set up the camera parameters
let eye = [0, 0, 15];    // Camera position
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

    var width = 4. * (f32(i) / f32(${SEGMENTS_PER_LINE}));
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

const dt = 0.01;
const WORKGROUP_SIZE = 8;
const simulationShaderModule = device.createShaderModule({
    label: 'Flow simulation shader',
    code: `
    @group(0) @binding(0) var<storage> lineCoordinates: array<f32>;
    @group(0) @binding(1) var<storage> lineLife: array<u32>;
    @group(0) @binding(2) var<storage, read_write> lineCoordinatesOut: array<f32>;
    @group(0) @binding(3) var<storage, read_write> lineLifeOut: array<u32>;

    fn getVelocityAtPoint(pos: vec3f) -> vec3f {
        let x = pos.x;
        let y = pos.y;
        let z = pos.z;
        return vec3f(-pos.y, pos.x, 0);
    }

    fn rk4(pos: vec3f, vel: vec3f, dt: f32) -> vec3f {
        let k1 = getVelocityAtPoint(pos);
        let k2 = getVelocityAtPoint(pos + 0.5 * dt * k1);
        let k3 = getVelocityAtPoint(pos + 0.5 * dt * k2);
        let k4 = getVelocityAtPoint(pos + dt * k3);
        return pos + dt * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
    }

    @compute
    @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
        let lineIndex = cell.x + cell.y * ${globalGridSize};
        // first we get the last point in the line:
        let lineHead = lineLife[lineIndex * 2 + 0];
        let lineLength = lineLife[lineIndex * 2 + 1];
        let lastPointIndex = lineIndex * ${POINTS_PER_LINE} + lineHead * ${POINT_DIMENSIONS};
        let lastPoint = vec3f(lineCoordinates[lastPointIndex + 0], lineCoordinates[lastPointIndex + 1], lineCoordinates[lastPointIndex + 2]);
        // now advance it:
        let newPos = vec3(lastPoint.x + 0.1, lastPoint.y, lastPoint.z);
        // now we need to update the line:
        let newHead = (lineHead + 1) % (${SEGMENTS_PER_LINE + 1});
        let newLength = u32(3);
        let newPointIndex = lineIndex * ${POINTS_PER_LINE} + newHead * ${POINT_DIMENSIONS};
        lineCoordinatesOut[newPointIndex + 0] = newPos.x;
        // lineCoordinatesOut[newPointIndex + 1] = newPos.y;
        // lineCoordinatesOut[newPointIndex + 2] = newPos.z;
        lineLifeOut[lineIndex * 2 + 0] = newHead;
        lineLifeOut[lineIndex * 2 + 1] = newLength;
    }
    `
});


const computeBindGroupLayout = device.createBindGroupLayout({
    label: 'Flow simulation bind group layout',
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.COMPUTE ,
        buffer: {
            type: 'read-only-storage'
        }
    }, {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
            type: 'read-only-storage'
        }
    }, {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
            type: 'storage'
        }
    }, {
        binding: 3,
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

const computeBindGroup = [
    device.createBindGroup({
        label: 'Line render compute bind group A',
        layout: computeBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: lineCoordinates[0], } 
        }, {
            binding: 1,
            resource: { buffer: lineLifeCycleStorage[0], } 
        }, {
            binding: 2,
            resource: { buffer: lineCoordinates[1], } 
        }, {
            binding: 3,
            resource: { buffer: lineLifeCycleStorage[1], } 
        }]
    }), 

    device.createBindGroup({
        label: 'Line render compute bind group B',
        layout: computeBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: lineCoordinates[1], } 
        }, {
            binding: 1,
            resource: { buffer: lineLifeCycleStorage[1], } 
        }, {
            binding: 2,
            resource: { buffer: lineCoordinates[0], } 
        }, {
            binding: 3,
            resource: { buffer: lineLifeCycleStorage[0], } 
        }]
    }), 
];

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
            format: cnvasFormat
        }]
    },
});

const renderBindGroup = [
    device.createBindGroup({
        label: 'Line render bind group A',
        layout: renderBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer, }
        }, {
            binding: 1,
            resource: { buffer: lineCoordinates[1], } 
        }, {
            binding: 2,
            resource: { buffer: lineLifeCycleStorage[1], } 
        }]
    }),
    device.createBindGroup({
        label: 'Line render bind group B',
        layout: renderBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer, }
        }, {
            binding: 1,
            resource: { buffer: lineCoordinates[0], } 
        }, {
            binding: 2,
            resource: { buffer: lineLifeCycleStorage[0], } 
        }]
    })
];


const UPDATE_INTERVAL = 200;
let step = 0;

function updateGrid() {
    step += 1;
    console.log(step);
    // let viewMatrix = mat4.create();

    // eye[0] = 20 * Math.sin(step/100);
    // eye[2] = 14 * Math.cos(step/100);
    // // Use the lookAt() method to construct the view matrix
    // mat4.lookAt(viewMatrix, eye, target, up);
    // mat4.multiply(mvpTypedArray, projectionMatrix, viewMatrix);
    // // mvpTypedArray = new Float32Array(modelViewProjectionMatrix);
    // device.queue.writeBuffer(uniformBuffer, 0, mvpTypedArray);

    // let x = Math.sin( step / 20);
    // let y = Math.cos( step / 20);
    // lineLifeCycleArray[0] = (lineLifeCycleArray[0] + 1) % (SEGMENTS_PER_LINE+ 1);
    // lineLifeCycleArray[1] = Math.min(1 + lineLifeCycleArray[1], SEGMENTS_PER_LINE);
    // lineCoordinatesArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 0] = x;
    // lineCoordinatesArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 1] = y;
    // lineCoordinatesArray[lineLifeCycleArray[0] * POINT_DIMENSIONS + 2] = 0;

    // lineLifeCycleArray[2] = (lineLifeCycleArray[2] + 1) % (SEGMENTS_PER_LINE+ 1);
    // lineLifeCycleArray[3] = Math.min(1 + lineLifeCycleArray[3], SEGMENTS_PER_LINE);

    // lineCoordinatesArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 0)+POINTS_PER_LINE] = x + 1.5;
    // lineCoordinatesArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 1)+POINTS_PER_LINE] = 0;
    // lineCoordinatesArray[(lineLifeCycleArray[2] * POINT_DIMENSIONS + 2)+POINTS_PER_LINE] = y;

    // device.queue.writeBuffer(lineLifeCycleStorage, 0, lineLifeCycleArray);
    // device.queue.writeBuffer(lineCoordinates, 0, lineCoordinatesArray);

    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, computeBindGroup[step % 2]);
    const workgroupCount = Math.ceil(LINE_COUNT / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount, 1);
    computePass.end();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0, 0.4, 1, 1],
            storeOp: 'store',
        }]
    });

    pass.setPipeline(renderPipeline);
    // 0 because this vertexBuffer corresponds to the first
    // vertexBufferLayout.attributes in the pipeline.
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, renderBindGroup[1]);
    pass.draw(vertices.length / 2, LINE_COUNT * (SEGMENTS_PER_LINE));
    pass.end();
    device.queue.submit([encoder.finish()]);


    //requestAnimationFrame(updateGrid);
}

// requestAnimationFrame(updateGrid);
setInterval(updateGrid, UPDATE_INTERVAL);