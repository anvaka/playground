import {LineStripCollection} from 'w-gl';
import hilbert from './hilbert';

export default class HilbertClock {
    constructor(order, size, startTime, lineColor = 0xffffff86) {
        this.order = order;
        this.size = size;
        this.lineColor = lineColor;
        this.startTime = startTime;
        this.numCells = Math.pow(2, order); // size of the Hilbert curve grid
        this.totalSegments = Math.pow(4, order); // total segments in the Hilbert curve
        this.cellSize = this.size / this.numCells; // size of each cell in pixels
        this.currentPosition = null;
        this.minutesPerSegment = 15;
    }

    // Hilbert curve recursive function
    hilbert(x, y, xi, xj, yi, yj, n) {
        if (n <= 0) {
            const px = (x + (xi + yi) / 2) * this.cellSize;
            const py = (y + (xj + yj) / 2) * this.cellSize;
            this.positions.add({ 
              x: px, 
              y: py,
              z: 0,
              color: this.lineColor
            });
        } else {
            this.hilbert(x, y, yi / 2, yj / 2, xi / 2, xj / 2, n - 1);
            this.hilbert(x + xi / 2, y + xj / 2, xi / 2, xj / 2, yi / 2, yj / 2, n - 1);
            this.hilbert(x + xi / 2 + yi / 2, y + xj / 2 + yj / 2, xi / 2, xj / 2, yi / 2, yj / 2, n - 1);
            this.hilbert(x + xi / 2 + yi, y + xj / 2 + yj, -yi / 2, -yj / 2, -xi / 2, -xj / 2, n - 1);
        }
    }

    // Generate Hilbert curve positions
    generateCurve() {
        this.positions = new LineStripCollection(this.totalSegments + 1);
        let useRecursion = true;
        if (useRecursion) {
            console.time('hilbert order ' + this.order);
            this.hilbert(0, 0, this.numCells, 0, 0, this.numCells, this.order);
            console.timeEnd('hilbert order ' + this.order); 
        } else {
            // hilbertIndexToXY(0, this.order);
            console.time('non-recursive hilbert order ' + this.order);
            for (let i = 0; i < this.totalSegments; i++) {
                const {x, y} = hilbertIndexToXY(i, this.order);
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                this.positions.add({ 
                  x: px, 
                  y: py,
                  z: 0,
                  color: this.lineColor
                });
            }
            console.timeEnd('non-recursive hilbert order ' + this.order);
        }
    }

    // Map current time to a segment on the Hilbert curve
    setCurrentTime(currentTime) {
        const elapsedTime = (currentTime - this.startTime) / (1000 * 60); // elapsed minutes
        const segmentIndex = Math.floor(elapsedTime / this.minutesPerSegment); 
        const posOffset = this.positions.itemsPerLine * (segmentIndex + 1); // + 1 because lineStripCollection has a first element reserved
        let startX = this.positions.positions[posOffset];
        let startY = this.positions.positions[posOffset + 1];
        let endX = this.positions.positions[posOffset + this.positions.itemsPerLine + 0];
        let endY = this.positions.positions[posOffset + this.positions.itemsPerLine + 1];
        let x = startX + (endX - startX) * (elapsedTime % this.minutesPerSegment) / this.minutesPerSegment;
        let y = startY + (endY - startY) * (elapsedTime % this.minutesPerSegment) / this.minutesPerSegment;
        this.currentPosition = {x, y};
        if (this.lastSegment !== segmentIndex) {
            let i = 0;
            while (i < segmentIndex) {
                const colorsOffset = this.positions.itemsPerLine * (i + 1) + 3;
                this.positions.colors[colorsOffset] = 0xffffff36;
                i++;
            }
            this.lastSegment = segmentIndex;
        }
    }

    setStartTime(startTime) {
        if (this.startTime === startTime) {
            return;
        }
        if (startTime > this.startTime) {
            // reset colors to default:
            let i = 0;
            while (i < this.totalSegments) {
                const colorsOffset = this.positions.itemsPerLine * (i + 1) + 3;
                this.positions.colors[colorsOffset] = this.lineColor;
                i++;
            }
        }
        this.startTime = startTime;
    }
}

function hilbertIndexToXY(h, order) {
    let n = 1 << order;
    let x = 0, y = 0;
    let t = h;
    for (let s = 1; s < n; s <<= 1) {
        let rx = 1 & (t >> 1);
        let ry = 1 & (t ^ rx);
        if (ry === 0) {
            if (rx === 1) {
                x = s - 1 - x;
                y = s - 1 - y;
            }
            // Swap x and y
            let temp = x;
            x = y;
            y = temp;
        }
        x += s * rx;
        y += s * ry;
        t >>= 2;
    }
    return { x, y };
}
