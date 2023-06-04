import ViewMatrix from './viewMatrix';
import createFPSControls from './createFPSControls';
import createSegmentedLines from './createSegmentedLines';
import createVectorFieldCalculator from './createVectorFieldCalculator';
import sharedState from './sharedState';
import createGuide from './createGuide';
import createKeyMap from './createKeyMap';

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

  let customEmitters = new Map();
  const LINE_COUNT = 2000;
  const POINT_DIMENSIONS = 4;
  const SEGMENTS_PER_LINE = 100;
  const POINTS_PER_LINE = POINT_DIMENSIONS * (SEGMENTS_PER_LINE + 1);
  let lastVisibleIndex = 0;

  // These segments will visualize our vector field.
  const lineCoordinatesArray = new Float32Array(LINE_COUNT * POINTS_PER_LINE);
  for (let i = 0; i < lineCoordinatesArray.length; ++i) {
    lineCoordinatesArray[i] = Math.random() * 2 - 1;
  }

  const guide = createGuide(drawContext);
  const fieldLines = createSegmentedLines(drawContext, LINE_COUNT, SEGMENTS_PER_LINE, lineCoordinatesArray, sharedState.rgba);
  fieldLines.setVisibleCount(0);
//   lastVisibleIndex = LINE_COUNT - 1;

  // And this is a compute shader to update the vector field.
  const vectorFieldCalculator = createVectorFieldCalculator(drawContext, fieldLines, sharedState.field);

  listenToEvents();
  const input = createFPSControls(drawContext, onAddLine);
  requestAnimationFrame(drawFrame);

  window.addEmitter = addEmitter;
  createKeyMap(input);

  return {
    viewMatrix: drawContext.view,
    updateField
  }

  function addEmitter(emitterDef, id) {
    let emitterId = emitterDef.id ?? id ?? 'emitter-' + (Math.round(Math.random()*1000)).toString(36);
    let field = emitterDef.field;
    let lineCount = emitterDef.lineCount || 420;
    let segmentCount = emitterDef.segmentCount || 100;
    
    let initialPositions = emitterDef.initialPositions;
    let color = emitterDef.color || sharedState.rgba;
    if (!initialPositions) {
      initialPositions = new Float32Array(lineCount * (segmentCount + 1) * 4);
      let startPoint = emitterDef.startPoint || [0, 0, 0, 0];
      while (startPoint.length < 4) {
        startPoint.push(0);
      }
      for (let i = 0; i < initialPositions.length; i++) {
        initialPositions[i] = startPoint[i % 4] + Math.random() * 2 - 1;
      }
    } 

    let emitterLines = createSegmentedLines(drawContext, lineCount, segmentCount, initialPositions, color);
    let emitterCalculator = createVectorFieldCalculator(drawContext, emitterLines, field);
    let emitter = {
      emitterId,
      calculate(encoder) {
        emitterCalculator.updatePositions(encoder);
      },
      draw(pass) {
        emitterLines.draw(pass);
      },
      remove() {
        emitterLines.dispose();
        customEmitters.delete(emitterId);
      }
    }
    customEmitters.set(emitterId, emitter);
    return emitter;
  }

  function updateField(newField) {
    lastVisibleIndex = 0;
    fieldLines.setVisibleCount(0);
    vectorFieldCalculator.setNewField(newField);
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
    customEmitters.forEach(emitter => emitter.calculate(encoder));

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0., 0., 0, 1],
            storeOp: 'store',
        }]
    });

    guide.draw(pass);
    fieldLines.draw(pass);
    customEmitters.forEach(emitter => emitter.draw(pass));

    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  function listenToEvents() {
    window.addEventListener('resize', resize);
  }

  function onAddLine(coordinate) {
    let lineCount = fieldLines.getVisibleCount();

    const device = drawContext.device;
    let lineState = new Uint32Array(fieldLines.ATTRIBUTES_PER_LINE);
    lineState[2] = sharedState.rgba;
    device.queue.writeBuffer( 
      fieldLines.lineLifeCycle, 
      lastVisibleIndex * fieldLines.ATTRIBUTES_PER_LINE * 4, 
      lineState
    );
    device.queue.writeBuffer(
      fieldLines.lineCoordinates,
      lastVisibleIndex * POINTS_PER_LINE * 4,
      Float32Array.from(coordinate)
    );

    lastVisibleIndex += 1;
    if (lastVisibleIndex >= LINE_COUNT) {
      lastVisibleIndex = 0;
    }

    if (lineCount < LINE_COUNT) {
        fieldLines.setVisibleCount(lineCount + 1);
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawContext.width = canvas.width;
    drawContext.height = canvas.height;
    drawContext.view.updateSize(drawContext.width, drawContext.height, drawContext.fov);
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
