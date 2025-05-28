// based on https://x.com/Rainmaker1973/status/1927016620968272316
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fill the available space
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = 800;
    canvas.height = 600;
}

function drawBeams(centerX, centerY, beamCount, radius) {
    const beamLength = 4 * radius;
    const angleStep = (2 * Math.PI) / beamCount;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < beamCount; i++) {
        const angle = i * angleStep;
        const endX = centerX + Math.cos(angle) * beamLength;
        const endY = centerY + Math.sin(angle) * beamLength;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

function drawPatternOnBeam(centerX, centerY, angle, radius) {
    const firstCenterX = centerX + Math.cos(angle) * radius;
    const firstCenterY = centerY + Math.sin(angle) * radius;
    const secondCenterX = centerX + Math.cos(angle) * (3 * radius);
    const secondCenterY = centerY + Math.sin(angle) * (3 * radius);
    
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    
    // First semicircle: center at R, curves to one side of beam
    ctx.beginPath();
    ctx.arc(firstCenterX, firstCenterY, radius, angle, angle + Math.PI, false);
    ctx.stroke();
    
    // Second semicircle: center at 3*R, curves to opposite side for S-shape
    ctx.beginPath();
    ctx.arc(secondCenterX, secondCenterY, radius, angle + Math.PI, angle + 4 * Math.PI/2, false);
    ctx.stroke();
}

function drawConnectingArc(centerX, centerY, beamAngle, R) {
    const arcCenterX = centerX + Math.cos(beamAngle) * 2 * R;
    const arcCenterY = centerY + Math.sin(beamAngle) * 2 * R;
    const arcRadius = 2 * R;

    // The arc starts at the tip of the beam (4R from the main center).
    // Relative to the arc's center, this starting point is at 'beamAngle'.
    const startAngle = beamAngle;

    // The arc connects to other patterns by ending at the main origin (centerX, centerY).
    // The main origin is part of the S-pattern of every other beam.
    // Relative to the arc's center, the origin is at 'beamAngle + Math.PI'.
    const endAngle = beamAngle - Math.PI/1.48; // Adjusted to connect to the origin

    ctx.strokeStyle = '#ff0000'; // Blue for the new arc
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Draw counterclockwise from startAngle to endAngle.
    ctx.arc(arcCenterX, arcCenterY, arcRadius, endAngle, startAngle, false);
    ctx.stroke();
}

// Initialize canvas
function init() {
    resizeCanvas();
    
    // Clear canvas with white background to see black beams
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const N = 5;
    const R = 50;
    
    drawBeams(centerX, centerY, N, R);

    // Draw semicircles and connecting arcs on each beam
    const angleStep = (2 * Math.PI) / N;
    for (let i = 0; i < N; i++) {
        const angle = i * angleStep;
        drawPatternOnBeam(centerX, centerY, angle, R);
        drawConnectingArc(centerX, centerY, angle, R);
    }
}

// Start when page loads
init();