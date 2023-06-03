import ViewMatrix from './viewMatrix';
import createFPSControls from './createFPSControls';
import createSegmentedLines from './createSegmentedLines';
import createVectorFieldCalculator from './createVectorFieldCalculator';

export default async function createScene(canvas) {
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
  await initWebGPU();

  const LINE_COUNT = 2000;
  const POINT_DIMENSIONS = 4;
  const SEGMENTS_PER_LINE = 100;
  const POINTS_PER_LINE = POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1);
  let lastVisibleIndex = 0;

  // These segments will visualize our vector field.
  const lineCoordinatesArray = new Float32Array(LINE_COUNT * POINTS_PER_LINE);
  const fieldLines = createSegmentedLines(drawContext, LINE_COUNT, SEGMENTS_PER_LINE, lineCoordinatesArray);
  fieldLines.setVisibleCount(0);

  const field = `
fn getVelocityAtPoint(pos: vec4f) -> vec4f {
    let x = pos.x;
    let y = pos.y;
    let z = pos.z;
    let w = pos.w;
    return vec4f(-y, x, 0, 0.);
}`
  // And this is a compute shader to update the vector field.
  const vectorFieldCalculator = createVectorFieldCalculator(drawContext, fieldLines, { dt: 0.1, field });

  listenToEvents();
  const input = createFPSControls(drawContext, onAddLine);
  requestAnimationFrame(drawFrame);

  return {
    viewMatrix: drawContext.view,
  }

  function drawFrame() {
    requestAnimationFrame(drawFrame);

    const {context, device} = drawContext;

    if (drawContext.view.updated) {
        device.queue.writeBuffer(
          drawContext.mvpUniform, 0, drawContext.view.modelViewProjection
        );
        drawContext.view.updated = false;
    }

    const encoder = device.createCommandEncoder();

    vectorFieldCalculator.updatePositions(encoder);

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0., 0., 0, 1],
            storeOp: 'store',
        }]
    });

    fieldLines.draw(pass);

    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  function listenToEvents() {
    window.addEventListener('resize', resize);
  }

  function onAddLine(coordinate) {
    let lineCount = fieldLines.getVisibleCount();
    if (lineCount >= LINE_COUNT) {
        lineCount = lastVisibleIndex;
        lastVisibleIndex = (lastVisibleIndex + 1) % LINE_COUNT;
    }

    const device = drawContext.device;
    device.queue.writeBuffer( 
        fieldLines.lineLifeCycle, 
        lineCount * fieldLines.ATTRIBUTES_PER_LINE * 4, 
        new Uint32Array(fieldLines.ATTRIBUTES_PER_LINE)
    );
    device.queue.writeBuffer(
        fieldLines.lineCoordinates,
        lineCount * POINTS_PER_LINE * 4,
        Float32Array.from(coordinate)
    );

    if (lineCount < LINE_COUNT) {
        fieldLines.setVisibleCount(lineCount + 1);
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawContext.width = canvas.width;
    drawContext.height = canvas.height;
  }

  async function initWebGPU() {
    if (!navigator.gpu) throw new Error('WebGPU not supported');

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) throw new Error('Failed to get adapter');

    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();

    const context = canvas.getContext('webgpu');
    context.configure({ device, format });

    const mvpTypedArray = drawContext.view.modelViewProjection;
    const mvpUniform = device.createBuffer({
        label: "mvp matrix",
        size: mvpTypedArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    drawContext.context = context;
    drawContext.canvasFormat = format;
    drawContext.device = device;
    drawContext.mvpUniform = mvpUniform;
    device.queue.writeBuffer(drawContext.mvpUniform, 0, drawContext.view.modelViewProjection);
  }
}
