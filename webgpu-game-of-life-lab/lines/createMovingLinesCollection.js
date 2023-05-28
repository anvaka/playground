let instanceCounter = 0;
export default function createMovingLinesCollection(
    drawContext, LINE_COUNT, SEGMENTS_PER_LINE, mvpUniformBuffer, lineCoordinatesArray,
    lineColor = [0.2, 0.4, .8, 0.7]
    ) {
    instanceCounter++;

    const { width, height, device, cnvasFormat } = drawContext;
    const POINT_DIMENSIONS = 3;
    const POINTS_PER_LINE = POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1);
    const lineLifeCycleArrayByteLength = LINE_COUNT * 2 * Uint32Array.BYTES_PER_ELEMENT; // first is the segment head, second is segment length

    const vertices = new Float32Array([
        -0.5, 0, -0.5, 1, 0.5, 1, // First 2D triangle of the quad
        -0.5, 0, 0.5, 1, 0.5, 0   // Second 2D triangle of the quad
    ]);
    const vertexBuffer = device.createBuffer({
        label: `Line vertices ${instanceCounter}`,
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
        label: `Line shader ${instanceCounter}`,
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

fn getColor(i: u32, start: vec3f, end: vec3f) -> vec4<f32> {
    return vec4f(${lineColor.join(',')});
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var i = input.instance;
    var output: VertexOutput;

    var lineIndex = u32(floor(f32(i) / f32(${SEGMENTS_PER_LINE})));
    var lineStart = lineIndex * ${POINTS_PER_LINE};
    var head = lineLifeCycle[lineIndex * 2 + 0];
    var length = lineLifeCycle[lineIndex * 2 + 1];
    i = i % ${SEGMENTS_PER_LINE};
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
    let resolution = vec2f(${width}, ${height});
    let screen0 = resolution * (0.5 * clip0.xy/clip0.w + 0.5);
    let screen1 = resolution * (0.5 * clip1.xy/clip1.w + 0.5);
    let xBasis = normalize(screen1 - screen0);
    let yBasis = vec2(-xBasis.y, xBasis.x);

    let pt0 = screen0 + width * input.pos.x * yBasis;
    let pt1 = screen1 + width * input.pos.x * yBasis;
    let pt = mix(pt0, pt1, input.pos.y);
    let clip = mix(clip0, clip1, input.pos.y);
    
    output.pos = vec4(clip.w * (2.0 * pt/resolution - 1.0), clip.z, clip.w);
    output.color = getColor(i, startPos, endPos);
    return output;
}
// @location(0) indicates which colorAttachment (specified in 
// beginRenderPass) to output to.
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    return input.color;
}`});


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

    const lineLifeCycleStorage = device.createBuffer({
        label: `Line life cycle ${instanceCounter}`,
        size: lineLifeCycleArrayByteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const lineCoordinates = device.createBuffer({
        label: "Line coordinates",
        size: lineCoordinatesArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(lineCoordinates, 0, lineCoordinatesArray);

    const renderBindGroup = device.createBindGroup({
        label: 'Line render bind group B',
        layout: renderBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: mvpUniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: lineCoordinates }
        }, {
            binding: 2,
            resource: { buffer: lineLifeCycleStorage, }
        }]
    })

    return {
        lineCoordinates,
        lineLifeCycle: lineLifeCycleStorage,
        draw
    }

    function draw(pass) {
        pass.setPipeline(renderPipeline);
        // 0 because this vertexBuffer corresponds to the first
        // vertexBufferLayout.attributes in the pipeline.
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setBindGroup(0, renderBindGroup);
        pass.draw(vertices.length / 2, LINE_COUNT * SEGMENTS_PER_LINE);
    }
}