const canvas = document.querySelector("canvas");
if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}
const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: device,
  format: canvasFormat,
});

const GRID_SIZE = 128*2;
// Create a uniform buffer that describes the grid.
const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
  label: "Grid Uniforms",
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

// Create an array representing the active state of each cell.
const ITEMS_PER_PARTICLE = 5; // Body index, px, py, vx, vy
const cellStateArray = new Float32Array(GRID_SIZE * GRID_SIZE * ITEMS_PER_PARTICLE);

// Create a storage buffer to hold the cell state.
const cellStateStorage = [
  device.createBuffer({
    label: "Cell State A",
    size: cellStateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Cell State B",
    size: cellStateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })
];

for (let i = 0; i < cellStateArray.length / ITEMS_PER_PARTICLE; ++i) {
  cellStateArray[i * ITEMS_PER_PARTICLE] = 0;
  let x = i % GRID_SIZE;
  let y = Math.floor(i / GRID_SIZE);
  cellStateArray[i * ITEMS_PER_PARTICLE + 1] = x;
  cellStateArray[i * ITEMS_PER_PARTICLE + 2] = y;
}
device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);
device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);

const vertices = new Float32Array([
  -0.8, -0.8, // Triangle 1 
   0.8, -0.8,
   0.8,  0.8,

  -0.8, -0.8, // Triangle 2 
   0.8,  0.8,
  -0.8,  0.8,
]);

const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0, }],
};

const bodies = [
  { mass: 10.0, position: { x: 140, y: 140 }, color: { r: 1.0, g: 0.0, b: 0.0 } },
  { mass: 10.0, position: { x: 120, y: 140 }, color: { r: 0.0, g: 1.0, b: 0.0 } },
  { mass: 10.0, position: { x: 120, y: 120 }, color: { r: 1.0, g: 1.0, b: 0.0 } },
  // { mass: 10.0, position: { x: 140, y: 120 }, color: { r: 0.0, g: 0.0, b: 1.0 } },
]

// Copy the bodies data into the buffer
const bodiesData = new Float32Array(bodies.length * 6);
for (let i = 0; i < bodies.length; i++) {
  const body = bodies[i];
  const offset = i * 6;
  bodiesData[offset + 0] = body.mass;
  bodiesData[offset + 1] = body.position.x;
  bodiesData[offset + 2] = body.position.y;
  bodiesData[offset + 3] = body.color.r;
  bodiesData[offset + 4] = body.color.g;
  bodiesData[offset + 5] = body.color.b;
}

// Create a buffer to store the bodies data
const bodiesBuffer = device.createBuffer({
  size: bodiesData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(bodiesBuffer, 0, bodiesData);

const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) color: vec3f,
};

struct FragInput {
  @location(0) color: vec3f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<f32>;
@group(0) @binding(3) var<storage, read> bodies: array<f32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  let i = input.instance * ${ITEMS_PER_PARTICLE};
  if (cellState[i] == 0.0) {
    // cell is still moving. Its position is stored in the cellState buffer.
    let cell = vec2f(cellState[i + 1], cellState[i + 2]);
    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos + 1) / grid - 1 + cellOffset;

    var output: VertexOutput;
    output.pos = vec4f(gridPos, 0, 1);
    output.color = vec3f(0, 1, 0.5);
    return output;
  } else {
    // cell has collided, mark it original position with the collided body color
    var output: VertexOutput;
    let cell = vec2f(f32(input.instance) % grid.x, floor(f32(input.instance) / grid.x));
    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
    output.pos = vec4f(gridPos, 0, 1);
    var bodyIndex = u32(cellState[i] - 1.0);
    output.color = vec3f(bodies[bodyIndex * 6 + 3], bodies[bodyIndex * 6 + 4], bodies[bodyIndex * 6 + 5]);
    return output;
  }
}

@fragment
fn fragmentMain(input: FragInput) -> @location(0) vec4f {
  return vec4f(input.color, 1);
}`
});

const bindGroupLayout = device.createBindGroupLayout({
  label: "Cell Bind Group Layout",
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
    buffer: {} // Grid uniform buffer
  }, {
    binding: 1,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
    buffer: { type: "read-only-storage"}
  }, {
    binding: 2,
    visibility: GPUShaderStage.COMPUTE,
    buffer: { type: "storage"}
  }, {
    binding: 3,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
    buffer: { type: "read-only-storage"}
  }]
});

const pipelineLayout = device.createPipelineLayout({
  label: "Cell Pipeline Layout", bindGroupLayouts: [ bindGroupLayout ]
});

const cellPipeline = device.createRenderPipeline({
  label: "Cell pipeline",
  layout: pipelineLayout,
  vertex: {
    module: cellShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "fragmentMain",
    targets: [{ format: canvasFormat }]
  }
});

const bindGroups = [
  device.createBindGroup({
    label: "Cell renderer bind group A",
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer }}, 
      { binding: 1, resource: { buffer: cellStateStorage[0] }}, 
      { binding: 2, resource: { buffer: cellStateStorage[1] }},
      { binding: 3, resource: { buffer: bodiesBuffer }}
    ],
  }),
   device.createBindGroup({
    label: "Cell renderer bind group B",
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } }, 
      { binding: 1, resource: { buffer: cellStateStorage[1] }},
      { binding: 2, resource: { buffer: cellStateStorage[0] }},
      { binding: 3, resource: { buffer: bodiesBuffer }}
    ],
  })
];



const WORKGROUP_SIZE = 8;
const simulationShaderModule = device.createShaderModule({
  label: "Life simulation shader",
  code: `
    @group(0) @binding(0) var<uniform> grid: vec2f;

    @group(0) @binding(1) var<storage> cellStateIn: array<f32>;
    @group(0) @binding(2) var<storage, read_write> cellStateOut: array<f32>;

    struct Particle {
      bodyTouched: f32,
      position: vec2f,
      velocity: vec2f
    };
    
    struct Body {
      mass: f32,
      position: vec2f,
      color: vec3f
    };
    @group(0) @binding(3) var<storage, read> bodies: array<f32>;

    fn cellIndex(cell: vec2u) -> u32 {
      return ((cell.y % u32(grid.y)) * u32(grid.x) +
              (cell.x % u32(grid.x))) * ${ITEMS_PER_PARTICLE};
    }

    fn calculateGravityForce(body: Body, particle: Particle) -> vec2f {
      let diff = body.position - particle.position;
      let d = length(diff);
      if (d <= 1.) {
        return vec2f(0.0, 0.0);
      }
      // Calculate the force magnitude
      const G = 0.01;
      let forceMagnitude = (G * (body.mass * 1.) / (d* d));
      return diff * forceMagnitude / d;
    }

    @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
      var particleIndex = cellIndex(cell.xy);
      var bodyTouched = cellStateIn[particleIndex];

      var netForce = vec2f(0, 0);
      var particle = Particle(bodyTouched, 
        vec2f(cellStateIn[particleIndex + 1], cellStateIn[particleIndex + 2]),
        vec2f(cellStateIn[particleIndex + 3], cellStateIn[particleIndex + 4])
      );
      if (bodyTouched == 0.0) {
        for (var i = 0u; i < ${bodies.length}u; i++) {
          let body = Body(
            bodies[i * 6 + 0],
            vec2f(bodies[i * 6 + 1], bodies[i * 6 + 2]),
            vec3f(bodies[i * 6 + 3], bodies[i * 6 + 4], bodies[i * 6 + 5])
          );
          let force = calculateGravityForce(body, particle);
          if (length(force) > 0) {
            netForce += force;
          } else {
            bodyTouched = f32(i + 1);
            break;
          }
        }
      }
      if (bodyTouched == 0.0) {
        let acceleration = netForce; // assume mass = 1
        let velocity = particle.velocity + acceleration * 2.;
        let position = particle.position + velocity;
        cellStateOut[particleIndex + 0] = bodyTouched;
        cellStateOut[particleIndex + 1] = position.x;
        cellStateOut[particleIndex + 2] = position.y;
        cellStateOut[particleIndex + 3] = velocity.x;
        cellStateOut[particleIndex + 4] = velocity.y;
      } else {
        cellStateOut[particleIndex + 0] = bodyTouched;
        cellStateOut[particleIndex + 1] = cellStateIn[particleIndex + 1];
        cellStateOut[particleIndex + 2] = cellStateIn[particleIndex + 2];
        cellStateOut[particleIndex + 3] = cellStateIn[particleIndex + 3];
        cellStateOut[particleIndex + 4] = cellStateIn[particleIndex + 4];
      }
    }
  `
});

const simulationPipeline = device.createComputePipeline({
  label: "Simulation pipeline",
  layout: pipelineLayout,
  compute: { module: simulationShaderModule, entryPoint: "computeMain"}
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [{
     view: context.getCurrentTexture().createView(),
     clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
     loadOp: "clear",
     storeOp: "store",
  }]
});

let step = 0;

function updateGrid() {
  const encoder = device.createCommandEncoder();

  for (let i = 0; i < 100; ++i) {
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);
    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
    computePass.end();
    step++; 
  }

  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
      storeOp: "store",
    }]
  });

  // Draw the grid.
  pass.setPipeline(cellPipeline);
  pass.setBindGroup(0, bindGroups[step % 2]);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

  // End the render pass and submit the command buffer
  pass.end();
  device.queue.submit([encoder.finish()]);

  requestAnimationFrame(updateGrid);
}

requestAnimationFrame(updateGrid);