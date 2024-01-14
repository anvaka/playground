import ViewMatrix from './viewMatrix.js';

const ITEMS_PER_PARTICLE = 8; // collided body index, x, y, vx, vy, life, startX, startY
const WORKGROUP_SIZE = 8;

export function createSimulation(gpuContext, GRID_SIZE, bodies) {
  const { device, canvasFormat, context, canvas } = gpuContext;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const drawContext = {
    width: canvas.width,
    height: canvas.height,
    fov: 45
  };
  const simulationRectangle = {
    left: -256,
    top: 256,
    width: 2*256,
    height:  2*256
  }
  const view = new ViewMatrix(drawContext);
  view.showRectangle(simulationRectangle);

  // Create a uniform buffer that describes the grid.
  const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
  const uniformBuffer = device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  const mvpTypedArray = view.modelViewProjection;
  const mvpUniformBuffer = device.createBuffer({
      label: "mvp matrix",
      size: mvpTypedArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(mvpUniformBuffer, 0, view.modelViewProjection);

  const particleStorage = initParticles(GRID_SIZE, simulationRectangle, device);

  const vertices = new Float32Array([
   -0.5, -0.5, // Triangle 1 
    0.5, -0.5,
    0.5,  0.5,

    -0.5, -0.5, // Triangle 2 
     0.5,  0.5,
    -0.5,  0.5,
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

  const particleShaderModule = device.createShaderModule({
    label: 'Particle render shader',
    code: `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) color: vec4f,
};

struct FragInput {
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> gridSize: vec2f;
@group(0) @binding(1) var<storage> particleState: array<f32>;
@group(0) @binding(3) var<storage, read> bodies: array<f32>;
@group(0) @binding(4) var<uniform> modelViewProjection: mat4x4<f32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let i = input.instance * ${ITEMS_PER_PARTICLE};
  let posScale = vec2f(${simulationRectangle.width} / gridSize.x, 
                        ${simulationRectangle.height} / gridSize.y);
  var pos = vec2f(particleState[i + 1], particleState[i + 2]) + input.pos * posScale;
  output.color = vec4f(0, 1, 0.5, 1.0);
  if (particleState[i] != 0.0) {
    // it has collided with a body
    var bodyIndex = u32(particleState[i] - 1.0);
    var alpha = max(0.4, 1.0 - (particleState[i + 5])/10000);
    output.color = vec4f(
      bodies[bodyIndex * 6 + 3], bodies[bodyIndex * 6 + 4], bodies[bodyIndex * 6 + 5],
      alpha // fade out the particle
    ) * alpha;
    pos = vec2f(particleState[i + 6], particleState[i + 7]) + input.pos * posScale;
  }
  output.pos = modelViewProjection * vec4f(pos, 0, 1);
  return output;
}

@fragment
fn fragmentMain(input: FragInput) -> @location(0) vec4f {
  return input.color;
}`
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: "Particle Bind Group Layout",
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
      buffer: {} // Grid uniform buffer
    }, {
      binding: 1,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
      buffer: { type: "read-only-storage" }
    }, {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "storage" }
    }, {
      binding: 3,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
      buffer: { type: "read-only-storage" } // bodies positions
    }, {
      binding: 4,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: 'uniform' } // mvp matrix
    }
  ]});

  const pipelineLayout = device.createPipelineLayout({
    label: "Particle Pipeline Layout", bindGroupLayouts: [bindGroupLayout]
  });

  const particlePipeline = device.createRenderPipeline({
    label: "Particle pipeline",
    layout: pipelineLayout,
    vertex: {
      module: particleShaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout]
    },
    fragment: {
      module: particleShaderModule,
      entryPoint: "fragmentMain",
      targets: [{ format: canvasFormat }]
    }
  });

  const bindGroups = [
    device.createBindGroup({
      label: "Particle renderer bind group A",
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: particleStorage[0] } },
        { binding: 2, resource: { buffer: particleStorage[1] } },
        { binding: 3, resource: { buffer: bodiesBuffer } },
        { binding: 4, resource: { buffer: mvpUniformBuffer } }
      ],
    }),
    device.createBindGroup({
      label: "Particle renderer bind group B",
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: particleStorage[1] } },
        { binding: 2, resource: { buffer: particleStorage[0] } },
        { binding: 3, resource: { buffer: bodiesBuffer } },
        { binding: 4, resource: { buffer: mvpUniformBuffer } }
      ],
    })
  ];

  const simulationShaderModule = device.createShaderModule({
    label: "Gravitational basins simulation shader",
    code: `
    @group(0) @binding(0) var<uniform> grid: vec2f;

    @group(0) @binding(1) var<storage> particleStateIn: array<f32>;
    @group(0) @binding(2) var<storage, read_write> particleStateOut: array<f32>;

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
    const PARTICLE_MASS = 1.0;
    const G = 0.01;
    const dT = 0.5;
    const collisionRadius = 1.0;

    fn cellIndex(cell: vec2u) -> u32 {
      return ((cell.y % u32(grid.y)) * u32(grid.x) +
              (cell.x % u32(grid.x))) * ${ITEMS_PER_PARTICLE};
    }

    fn calculateGravityForce(body: Body, particle: Particle) -> vec2f {
      let diff = body.position - particle.position;
      let d = length(diff);
      if (d <= collisionRadius) {
        // we consider this a collision. Not very accurate but it is a simulation
        return vec2f(0.0, 0.0);
      }
      // Calculate the force magnitude
      let forceMagnitude = (G * (body.mass * PARTICLE_MASS) / (d * d));
      return diff * forceMagnitude / d;
    }

    @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
      var particleIndex = cellIndex(cell.xy);
      var bodyTouched = particleStateIn[particleIndex];

      var netForce = vec2f(0, 0);
      var particle = Particle(bodyTouched, 
        vec2f(particleStateIn[particleIndex + 1], particleStateIn[particleIndex + 2]),
        vec2f(particleStateIn[particleIndex + 3], particleStateIn[particleIndex + 4])
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
        // Calculate acceleration (Newton's second law: F = ma)
        let acceleration = netForce/PARTICLE_MASS;
        // Update velocity (v = u + at)
        let velocity = particle.velocity + acceleration * dT; 
        // Update position (s = ut + 0.5at^2)
        let position = particle.position + velocity * dT + 0.5 * acceleration * dT * dT;

        particleStateOut[particleIndex + 0] = bodyTouched;
        particleStateOut[particleIndex + 1] = position.x;
        particleStateOut[particleIndex + 2] = position.y;
        particleStateOut[particleIndex + 3] = velocity.x;
        particleStateOut[particleIndex + 4] = velocity.y;
        particleStateOut[particleIndex + 5] = particleStateIn[particleIndex + 5] + 1.0;
      } else {
        particleStateOut[particleIndex + 0] = bodyTouched;
        particleStateOut[particleIndex + 1] = particleStateIn[particleIndex + 1];
        particleStateOut[particleIndex + 2] = particleStateIn[particleIndex + 2];
        particleStateOut[particleIndex + 3] = particleStateIn[particleIndex + 3];
        particleStateOut[particleIndex + 4] = particleStateIn[particleIndex + 4];
        particleStateOut[particleIndex + 5] = particleStateIn[particleIndex + 5];
      }
    }
  `
  });

  const simulationPipeline = device.createComputePipeline({
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: { module: simulationShaderModule, entryPoint: "computeMain" }
  });

  let step = 0;

  function updateGrid() {
    const encoder = device.createCommandEncoder();

    // compute positions/collisions
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

    // Draw particles
    pass.setPipeline(particlePipeline);
    pass.setBindGroup(0, bindGroups[step % 2]);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
    pass.end();

    device.queue.submit([encoder.finish()]);
  }

  return {
    update: updateGrid
  }
}

function initParticles(GRID_SIZE, simulationRectangle, device) {
    // Create an array representing the active state of each particle.
    const particleCount = GRID_SIZE * GRID_SIZE;
    const particleStateArray = new Float32Array(particleCount * ITEMS_PER_PARTICLE);

    // Create a storage buffer to hold the particles state (ping ponged)
    const particleStorage = [
      device.createBuffer({
        label: "Particle State A",
        size: particleStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      device.createBuffer({
        label: "Particle State B",
        size: particleStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    ];

    // we have particleCount particles, and we want to "tile" the simulation rectangle with them
    // so we need to calculate the position of each particle in the grid
    // we use the particle index to calculate the position in the grid
    for (let i = 0; i < particleCount; ++i) {
      const nx = (i % GRID_SIZE) / GRID_SIZE;
      const ny = Math.floor(i / GRID_SIZE) / GRID_SIZE;

      const x = nx * simulationRectangle.width + simulationRectangle.left;
      const y = simulationRectangle.top - ny * simulationRectangle.height;
  
      particleStateArray[i * ITEMS_PER_PARTICLE + 0] = 0; // collided body index
      particleStateArray[i * ITEMS_PER_PARTICLE + 1] = x; // current position x
      particleStateArray[i * ITEMS_PER_PARTICLE + 2] = y; // current position y
      particleStateArray[i * ITEMS_PER_PARTICLE + 6] = x; // original position x
      particleStateArray[i * ITEMS_PER_PARTICLE + 7] = y; // original position y
    }
  
    device.queue.writeBuffer(particleStorage[0], 0, particleStateArray);
    device.queue.writeBuffer(particleStorage[1], 0, particleStateArray);

    return particleStorage;
}