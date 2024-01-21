import { createSimulation } from './simulation.js';
const GRID_SIZE = 128*2;

const bodies = [
  // { mass: 10.0, position: { x: -120, y: 0 }, color: { r: 1.0, g: 0.0, b: 0.0 } },
  // { mass: 10.0, position: { x: 10, y: 0 }, color: { r: 0.0, g: 1.0, b: 0.0 } },
  // { mass: 10.0, position: { x: 100, y: 0 }, color: { r: 1.0, g: 1.0, b: 0.0 } },
  // { mass: 10.0, position: { x: 0, y: 120 }, color: { r: 0.0, g: 1.0, b: 1.0 } },
]

let bodyCount = 7;
let angle = 2 * Math.PI / bodyCount;
let blueRangeStart = 180;  // Starting hue for blue shades
let blueRangeEnd = 240;    // Ending hue for blue shades
let blueRange = blueRangeEnd - blueRangeStart;

for (let i = 0; i < bodyCount; i++) {
    let x = Math.cos(angle * i) * GRID_SIZE / 4;  //  + Math.random() * GRID_SIZE/ 2;
    let y = Math.sin(angle * i) * GRID_SIZE / 4;  //  + Math.random() * GRID_SIZE/ 2;
    let mass = Math.random() * 10;
    let hue = blueRangeStart/360 + (i * blueRange / bodyCount) / 360;

    let color = hslToRgb(hue, 0.5, 0.5); // Adjust saturation and lightness as needed
    bodies.push({
        mass,
        position: { x, y },
        color: {
            r: color.r,
            g: color.g,
            b: color.b
        }
    });
}

// Helper function to convert HSL to RGB
// This function will take HSL values and convert them to an RGB format
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: r, g: g, b: b };
}


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