const canvas = document.querySelector('canvas');
const size = Math.min(window.innerWidth, window.innerHeight)
canvas.width = size;
canvas.height = size;
const GRID_SIZE = size/8;

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


const unfiformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
    label: "Grid uniforms",
    size: unfiformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, unfiformArray);

const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
const cellStateStorage = [
    device.createBuffer({
        label: "Cell state A",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Cell state B",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
];

for (let i = 0; i < cellStateArray.length; i += 3) {
    cellStateArray[i] = Math.random() > 0.5 ? 1 : 0;
}
device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

const vertices = new Float32Array([
    // X, Y
    -0.8, -0.8,
     0.8, -0.8,
     0.8, 0.8,
    -0.8, -0.8,
     0.8, 0.8,
    -0.8, 0.8,
]);
const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
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

const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: `
@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

struct VertexInput {
    @location(0) pos: vec2<f32>,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) cell: vec2<f32>,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    let i = f32(input.instance);
    let cell = vec2f(i % grid.x, floor(i/grid.x));
    let state = f32(cellState[input.instance]);

    let gridPos = state * ((input.pos + 1) / grid - 1 + cell/grid * 2);
    var output: VertexOutput;
    output.pos = vec4f(gridPos, 0, 1);
    output.cell = cell;
    return output;
}
// @location(0) indicates which colorAttachment (specified in 
// beginRenderPass) to output to.
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.cell/grid, 0.8, 1);
}`});

const WORKGROUP_SIZE = 8;
const simulationShaderModule = device.createShaderModule({
    label: "Game of Life Simulation shader",
    code: `
    @group(0) @binding(0) var<uniform> grid: vec2f;
    @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
    @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

    fn cellIndex(cell: vec2u) -> u32 {
        return (cell.y % u32(grid.y)) * u32(grid.x) + (cell.x % u32(grid.x));
    }

    fn cellActive(x: u32, y: u32) -> u32 {
        return cellStateIn[cellIndex(vec2u(x, y))];
    }

    @compute
    @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
        let activeNeighbors = cellActive(cell.x + 1, cell.y + 1) +
            cellActive(cell.x + 1, cell.y + 0) +
            cellActive(cell.x + 1, cell.y - 1) +
            cellActive(cell.x + 0, cell.y - 1) +
            cellActive(cell.x - 1, cell.y - 1) +
            cellActive(cell.x - 1, cell.y + 0) +
            cellActive(cell.x - 1, cell.y + 1) +
            cellActive(cell.x + 0, cell.y + 1);
        
        let i = cellIndex(cell.xy);

        switch activeNeighbors {
            case 2: { // Active cells with 2 neighbors stay active.
                cellStateOut[i] = cellStateIn[i];
            }
            case 3: { // All cells with 3 neighbors become active.
                cellStateOut[i] = 1;
            }
            default: { // All other cells become inactive.
                cellStateOut[i] = 0;
            }
        }
    }
    `
});

const bindGroupLayout = device.createBindGroupLayout({
    label: 'Cell bind group layout',
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform'}
    }, {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
        buffer: { type: 'read-only-storage' }
    }, {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'storage' }
    }]
});

const pipelineLayout = device.createPipelineLayout({
    label: "Cell pipeline layout",
    bindGroupLayouts: [bindGroupLayout]
});

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: pipelineLayout,
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: cnvasFormat
        }]
    },
});

const bindGroups = [
    device.createBindGroup({
        label: 'Cell renderer bind group A',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer, }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[0] }
        }, {
            binding: 2,
            resource: { buffer: cellStateStorage[1] }
        }]
    }),
    device.createBindGroup({
        label: 'Cell renderer bind group B',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer, }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[1] }
        }, {
            binding: 2,
            resource: { buffer: cellStateStorage[0] }
        }]
    }),
];

const simulationPipeline = device.createComputePipeline({
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
});

const UPDATE_INTERVAL = 20;
let step = 0;

function updateGrid() {
    const encoder = device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);
    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount, 1);
    computePass.end();

    step += 1;

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
    pass.setBindGroup(0, bindGroups[step % 2]);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(updateGrid);
}

requestAnimationFrame(updateGrid);