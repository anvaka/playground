// exponential_sum_modified_loop.js
const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 800;
const height = 800;

function generateSimpleFunction() {
    return generateModuloFunction();
    // Random parameters within controlled ranges
    const A = Math.random() * 50 + 1; // A between 1 and 51 to avoid division by zero
    const B = Math.random() * 10;     // B between 0 and 10
    const C = Math.random() * 200;    // C between 0 and 200

    // Define the function f(x)
    function f(x) {
        return x / A + B * Math.cos(x * C);
    }

    // Store the function expression for printing and URL
    const code = `x / ${A} + ${B} * cos(x * ${C})`;
    const params = `f(x) = x / ${A} + ${B} * cos(x * ${C})`;

    return { f, code, params };
}

function measureSum(N, f) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let x = 0, y = 0;
    for (let n = 1; n <= N; n++) {
        const phi = f(n) * 2 * Math.PI;
        x += Math.cos(phi);
        y += Math.sin(phi);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
}

function main() {
    const N = 42000;

    while (true) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const { f, code, params } = generateSimpleFunction();

        const { minX, minY, maxX, maxY } = measureSum(N, f);

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;

        const padding = 20; // pixels of padding around the image

        const scaleX = (width - 2 * padding) / rangeX;
        const scaleY = (height - 2 * padding) / rangeY;

        // Use the smaller scale to maintain aspect ratio
        const scale = Math.min(scaleX, scaleY);

        // Compute the offsets to center the image
        const offsetX = padding - minX * scale + (width - 2 * padding - rangeX * scale) / 2;
        const offsetY = padding - minY * scale + (height - 2 * padding - rangeY * scale) / 2;

        // Clear the canvas and set the background color
        ctx.fillStyle = 'rgba(12, 41, 82, 1)';
        ctx.fillRect(0, 0, width, height);

        // Set the line color with desired opacity
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;

        let x = 0, y = 0;
        let prevCanvasX = x * scale + offsetX;
        let prevCanvasY = y * scale + offsetY;

        for (let n = 1; n <= N; n++) {
            const phi = f(n) * 2 * Math.PI;
            x += Math.cos(phi);
            y += Math.sin(phi);
            const canvasX = x * scale + offsetX;
            const canvasY = y * scale + offsetY;

            // Draw each line segment separately
            ctx.beginPath();
            ctx.moveTo(prevCanvasX, prevCanvasY);
            ctx.lineTo(canvasX, canvasY);
            ctx.stroke();

            prevCanvasX = canvasX;
            prevCanvasY = canvasY;
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const filename = `exponential_sum_${timestamp}.png`;

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filename, buffer);

        // Construct the URL
        const encodedCode = encodeURIComponent(code);
        const url = `https://anvaka.github.io/e-sum/?code=${encodedCode}&bufferSize=${N}&totalSteps=${N}&spi=500`;

        // Output markdown to stdout
        console.log('Function used:\n');
        console.log(`\`f(x) = ${code}\`\n`);
        console.log(`![function](${filename})\n`);
        console.log(`[Interactive version](${url})\n`);
    }
}

main();


function generateCombinationFunction() {
    const A = Math.random() * 5;
    const B = Math.random() * 5;
    const C = Math.random() * 100;

    function f(x) {
        return A * x + B * Math.sin(C * x);
    }

    const code = `${A} * x + ${B} * sin(${C} * x)`;
    const params = `f(x) = ${code}`;

    return { f, code, params };
}
function generateModuloFunction() {
    const A = Math.random() * 0.01;
    const B = Math.random() * 0.01;
    const C = Math.random() * 10;

    function f(x) {
        return A * x * x + B * x + C;
    }

    const code = `${A} * x^2 + ${B} * x + ${C}`;
    const params = `f(x) = ${code}`;

    return { f, code, params };
}