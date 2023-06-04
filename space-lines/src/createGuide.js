import createSegmentedLines from './createSegmentedLines';

export default function createGuide(drawContext) {
    let lines = [];
    let lifeCycle = [];
    let minX = -50, maxX = 50, minY = -50, maxY = 50;
    let xStep = 1, yStep = 1;
    let gridColor = 0x44448844;
    let dotsPerLine = 12;
    for (let x = minX; x <= maxX; x += xStep) {
        lines.push(
            x, minY, 0, 0,
            x, minY, 0, 0,
            x, maxY, 0, 0
        )
        lifeCycle.push(0, 2, gridColor);
    }
    for (let y = minY; y <= maxY; y += yStep) {
        lines.push(
            minX, y, 0, 0,
            minX, y, 0, 0,
            maxX, y, 0, 0
        )
        lifeCycle.push(0, 2, gridColor);
    }

    // let's add oX, oY, oZ:
    lines.push(
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 1, 0, 0,
    );
    lifeCycle.push(0, 2, 0x00ff00ff);
    lines.push(
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 1, 0,
    );
    lifeCycle.push(0, 2, 0xffff00ff);
    lines.push(
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
    );
    lifeCycle.push(0, 2, 0xff0000ff);

    let linesSceneEl = createSegmentedLines(drawContext, lines.length / dotsPerLine, 2, new Float32Array(lines), 200, .6);
        
    drawContext.device.queue.writeBuffer(
        linesSceneEl.lineLifeCycle,
        0, new Uint32Array(lifeCycle));

    return {
        draw(pass) {
            linesSceneEl.draw(pass);
        }
    }
}