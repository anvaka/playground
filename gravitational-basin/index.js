import { createSimulation } from './simulation.js';
const GRID_SIZE = 128*4;

const bodies = [
  { mass: 10.0, position: { x: -120, y: 0 }, color: { r: 1.0, g: 0.0, b: 0.0 } },
  { mass: 10.0, position: { x: 120, y: 0 }, color: { r: 0.0, g: 1.0, b: 0.0 } },
  { mass: 10.0, position: { x: 0, y: 0 }, color: { r: 1.0, g: 1.0, b: 0.0 } },
  // { mass: 10.0, position: { x: 120, y: 0 }, color: { r: 0.0, g: 0.0, b: 1.0 } },
  { mass: 10.0, position: { x: 0, y: 120 }, color: { r: 0.0, g: 1.0, b: 1.0 } },
]

getWebGPUContext().then((gpuContext) => {
  let simulation = createSimulation(gpuContext, GRID_SIZE, bodies)

  requestAnimationFrame(function render() {
    simulation.update();
    requestAnimationFrame(render);
  });
});

async function getWebGPUContext() {
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
  return {context, device, canvasFormat, canvas};
}