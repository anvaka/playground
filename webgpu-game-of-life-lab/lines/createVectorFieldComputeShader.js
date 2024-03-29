export default function createVectorFieldComputeShader(drawContext, LINE_COUNT, SEGMENTS_PER_LINE,
    lineCoordinatesStorage, lineLifeCycleStorage, fieldConfig) {
    let dt = fieldConfig.dt;

    const WORKGROUP_SIZE = 8;

    const POINT_DIMENSIONS = 4;
    const POINTS_PER_LINE = POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1);

    const { device } = drawContext;

    const computeBindGroupLayout = device.createBindGroupLayout({
        label: 'Flow simulation bind group layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });

    const computePipelineLayout = device.createPipelineLayout({
        label: 'Flow simulation compute pipeline layout',
        bindGroupLayouts: [computeBindGroupLayout]
    });

    let simulationPipeline = createPipeline(fieldConfig.field);
    const computeBindGroup = device.createBindGroup({
        label: 'Line render compute bind group A',
        layout: computeBindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: lineCoordinatesStorage, }
        }, {
            binding: 1,
            resource: { buffer: lineLifeCycleStorage, }
        },
        ]
    });

    return {
        updatePositions,
        setNewField
    };

    function setNewField(newField) {
        let updatedPipeline = createPipeline(newField);
        simulationPipeline = updatedPipeline;
    }

    function updatePositions(encoder) {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(simulationPipeline);
        computePass.setBindGroup(0, computeBindGroup);
        const workgroupCount = Math.ceil(LINE_COUNT / WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount);
        computePass.end();
    }

    function createPipeline(field) {
        const simulationShaderModule = device.createShaderModule({
            label: 'Flow simulation shader',
            code: `
        @group(0) @binding(0) var<storage, read_write> lineCoordinates: array<f32>;
        @group(0) @binding(1) var<storage, read_write> lineLifeCycle: array<u32>;
    
        ${field}
    
        fn rk4(pos: vec4f, dt: f32) -> vec4f {
            let k1 = getVelocityAtPoint(pos);
            let k2 = getVelocityAtPoint(pos + 0.5 * dt * k1);
            let k3 = getVelocityAtPoint(pos + 0.5 * dt * k2);
            let k4 = getVelocityAtPoint(pos + dt * k3);
            return pos + dt * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
        }
    
        fn rand(co: vec4f) -> f32 {
            let t = dot(vec4f(12.9898, 78.233, 53.12, 4375.85453), co);
            let x = sin(t) * (4375.85453 + t);
            return fract(x);
        }
    
        @compute
        @workgroup_size(${WORKGROUP_SIZE})
        fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
            let lineIndex = cell.x;
            if (lineIndex >= ${LINE_COUNT}) {
                return;
            }
            // first we get the last point in the line:
            var lineHead = lineLifeCycle[lineIndex * 2 + 0];
            var lineLength = lineLifeCycle[lineIndex * 2 + 1];
            var lastPosIndex = lineIndex * ${POINTS_PER_LINE} + lineHead * ${POINT_DIMENSIONS};
            var lastPos = vec4f(
                lineCoordinates[lastPosIndex + 0], lineCoordinates[lastPosIndex + 1], 
                lineCoordinates[lastPosIndex + 2], lineCoordinates[lastPosIndex + 3]
                );
    
            if (rand(lastPos * f32(lineIndex)) > 10) {
                lastPos = vec4f(rand(lastPos), rand(lastPos - 1), rand(lastPos + 1), rand(lastPos + 2)) * 2.0 - 1.0;
    
                lastPosIndex = lineIndex * ${POINTS_PER_LINE} + (${SEGMENTS_PER_LINE} * ${POINT_DIMENSIONS});
                lineCoordinates[lastPosIndex + 0] = lastPos.x;
                lineCoordinates[lastPosIndex + 1] = lastPos.y;
                lineCoordinates[lastPosIndex + 2] = lastPos.z;
                lineCoordinates[lastPosIndex + 3] = lastPos.w;
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
            lineCoordinates[newPosIndex + 3] = newPos.w;
    
            lineLifeCycle[lineIndex * 2 + 0] = (lineHead + 1) % (${SEGMENTS_PER_LINE + 1});
            lineLifeCycle[lineIndex * 2 + 1] = newLength;
        }
        `
        });
        return device.createComputePipeline({
            label: 'Flow simulation pipeline',
            layout: computePipelineLayout,
            compute: {
                module: simulationShaderModule,
                entryPoint: 'computeMain',
            }
        });
    }
}