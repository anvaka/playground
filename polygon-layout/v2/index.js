// Grid-Based Polygon Layout Algorithm

// Constants
const GRID_SIZE = 400;
const CELL_SIZE = 5;
const GRID_CELLS = GRID_SIZE / CELL_SIZE;

// Main Canvas Setup
let canvas, ctx;

// Data Structures
let grid = []; // 2D grid representing the layout space
let polygons = []; // List of polygons to place
let placedPolygons = []; // Polygons that have been placed on the grid

// Create a sample polygon with cities
function createSamplePolygon(id, vertices, cities, color) {
  return {
    id: id,
    vertices: vertices, // Array of [x, y] coordinates
    cities: cities, // Array of {id, x, y, connections: [{targetId, weight}]}
    color: color || `hsl(${Math.random() * 360}, 70%, 70%)`,
    position: [0, 0], // Current position on the grid
    placed: false
  };
}

// Generate sample data
function generateSampleData() {
  // Clear existing data
  polygons = [];
  placedPolygons = [];
  
  // Create sample polygons with proper city-to-city connections
  // Each city has a unique ID: polygonId-cityIndex
  
  // Polygon 1 - Triangle
  const p1 = createSamplePolygon(
    1,
    [[0, 0], [40, 0], [20, 40]],
    [
      {id: "1-0", x: 10, y: 10, connections: [{targetId: "2-0", weight: 5}, {targetId: "3-0", weight: 2}]}
    ],
    'rgba(255, 100, 100, 0.7)'
  );
  
  // Polygon 2 - Rectangle
  const p2 = createSamplePolygon(
    2,
    [[0, 0], [50, 0], [50, 30], [0, 30]],
    [
      {id: "2-0", x: 15, y: 15, connections: [{targetId: "1-0", weight: 5}, {targetId: "3-0", weight: 3}]},
      {id: "2-1", x: 35, y: 15, connections: [{targetId: "4-0", weight: 2}]}
    ],
    'rgba(100, 255, 100, 0.7)'
  );
  
  // Polygon 3 - Pentagon
  const p3 = createSamplePolygon(
    3,
    [[20, 0], [40, 10], [30, 40], [10, 40], [0, 10]],
    [
      {id: "3-0", x: 20, y: 20, connections: [{targetId: "1-0", weight: 2}, {targetId: "2-0", weight: 3}]}
    ],
    'rgba(100, 100, 255, 0.7)'
  );
  
  // Polygon 4 - Small Square
  const p4 = createSamplePolygon(
    4,
    [[0, 0], [25, 0], [25, 25], [0, 25]],
    [
      {id: "4-0", x: 12, y: 12, connections: [{targetId: "2-1", weight: 2}]}
    ],
    'rgba(255, 255, 100, 0.7)'
  );
  
  // Add polygons to our list
  polygons.push(p1, p2, p3, p4);
}

// Initialize the grid
function initializeGrid() {
  grid = Array(GRID_CELLS).fill().map(() => Array(GRID_CELLS).fill(0));
}

// Calculate which cells a polygon would occupy at a given position
function getOccupiedCells(polygon, position) {
  const [posX, posY] = position;
  const cells = [];
  
  // For simplicity, we'll treat the polygon as its bounding box
  // In a real implementation, you'd use a more accurate polygon-cell intersection
  const xs = polygon.vertices.map(v => v[0]);
  const ys = polygon.vertices.map(v => v[1]);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const startCellX = Math.floor((posX + minX) / CELL_SIZE);
  const endCellX = Math.ceil((posX + maxX) / CELL_SIZE);
  const startCellY = Math.floor((posY + minY) / CELL_SIZE);
  const endCellY = Math.ceil((posY + maxY) / CELL_SIZE);
  
  for (let x = startCellX; x < endCellX; x++) {
    for (let y = startCellY; y < endCellY; y++) {
      if (x >= 0 && x < GRID_CELLS && y >= 0 && y < GRID_CELLS) {
        cells.push([x, y]);
      }
    }
  }
  
  return cells;
}

// Calculate value for placing a polygon at a position
function calculateValue(polygon, position) {
  const occupiedCells = getOccupiedCells(polygon, position);
  let value = 0;
  
  // Check if placement is valid (no overlap)
  for (const [x, y] of occupiedCells) {
    if (grid[y][x] !== 0) {
      return -Infinity; // Invalid placement (cell already occupied)
    }
  }
  
  // Get all placed polygons that this polygon has connections with
  const connectedPolygonIds = new Set();
  for (const city of polygon.cities) {
    for (const connection of city.connections) {
      const [targetPolyId, _] = connection.targetId.split('-');
      connectedPolygonIds.add(targetPolyId);
    }
  }
  
  // Calculate connection value with placed polygons based on city-to-city connections
  let hasConnections = false;
  for (const city of polygon.cities) {
    for (const connection of city.connections) {
      // Parse target ID to find polygon ID and city index
      const [targetPolyId, targetCityIdx] = connection.targetId.split('-');
      
      // Find the target polygon
      const targetPolygon = placedPolygons.find(p => p.id.toString() === targetPolyId);
      if (targetPolygon) {
        hasConnections = true;
        // Find the specific target city
        const targetCity = targetPolygon.cities.find(c => c.id === connection.targetId);
        if (targetCity) {
          const cityPosX = position[0] + city.x;
          const cityPosY = position[1] + city.y;
          const targetPosX = targetPolygon.position[0] + targetCity.x;
          const targetPosY = targetPolygon.position[1] + targetCity.y;
          
          const distance = Math.sqrt(
            Math.pow(cityPosX - targetPosX, 2) + 
            Math.pow(cityPosY - targetPosY, 2)
          );
          
          // Closer connected cities provide higher value
          // Higher weights provide higher value
          value += (connection.weight * 1000) / (distance + 1);
        }
      }
    }
  }
  
  // Penalize proximity to unconnected polygons
  for (const placedPolygon of placedPolygons) {
    // Skip if this is a connected polygon
    if (connectedPolygonIds.has(placedPolygon.id.toString())) {
      continue;
    }
    
    // Calculate center-to-center distance
    const placedCenter = [
      placedPolygon.position[0] + 25, // Approximating center
      placedPolygon.position[1] + 25  // Approximating center
    ];
    
    const thisCenter = [
      position[0] + 25, // Approximating center
      position[1] + 25  // Approximating center
    ];
    
    const distance = Math.sqrt(
      Math.pow(placedCenter[0] - thisCenter[0], 2) + 
      Math.pow(placedCenter[1] - thisCenter[1], 2)
    );
    
    // If unconnected polygons are close, apply penalty
    // The closer they are, the bigger the penalty
    if (distance < 100) { // 100 pixels threshold
      value -= (10000 / (distance + 1));
    }
  }
  
  // Proximity to grid center (slight preference for central placement)
  const centerX = GRID_SIZE / 2;
  const centerY = GRID_SIZE / 2;
  const distanceToCenter = Math.sqrt(
    Math.pow(position[0] - centerX, 2) + 
    Math.pow(position[1] - centerY, 2)
  );
  
  value += 1000 / (distanceToCenter + 1);
  
  return value;
}

// Place polygon on the grid at a specific position
function placePolygon(polygon, position) {
  const [posX, posY] = position;
  polygon.position = [posX, posY];
  polygon.placed = true;
  placedPolygons.push(polygon);
  
  // Mark cells as occupied
  const occupiedCells = getOccupiedCells(polygon, position);
  for (const [x, y] of occupiedCells) {
    grid[y][x] = polygon.id;
  }
}

// Run the placement algorithm
function runPlacementAlgorithm() {
  // Sort polygons by importance (number of connections * weight)
  polygons.sort((a, b) => {
    const aValue = a.cities.reduce((sum, city) => 
      sum + city.connections.reduce((s, conn) => s + conn.weight, 0), 0);
    const bValue = b.cities.reduce((sum, city) => 
      sum + city.connections.reduce((s, conn) => s + conn.weight, 0), 0);
    return bValue - aValue;
  });
  
  // Place first polygon in the center
  if (polygons.length > 0) {
    const firstPolygon = polygons[0];
    const centerX = GRID_SIZE / 2 - 20; // Offset slightly to avoid edge issues
    const centerY = GRID_SIZE / 2 - 20;
    placePolygon(firstPolygon, [centerX, centerY]);
  }
  
  // Place remaining polygons
  for (let i = 1; i < polygons.length; i++) {
    const polygon = polygons[i];
    let bestPosition = null;
    let bestValue = -Infinity;
    
    // Sample positions in a grid pattern
    const step = CELL_SIZE * 2;
    for (let x = 0; x < GRID_SIZE; x += step) {
      for (let y = 0; y < GRID_SIZE; y += step) {
        const value = calculateValue(polygon, [x, y]);
        if (value > bestValue) {
          bestValue = value;
          bestPosition = [x, y];
        }
      }
    }
    
    // Place polygon at best position
    if (bestPosition) {
      placePolygon(polygon, bestPosition);
    }
  }
}

// Draw the grid
function drawGrid() {
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;
  
  for (let x = 0; x <= GRID_SIZE; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GRID_SIZE);
    ctx.stroke();
  }
  
  for (let y = 0; y <= GRID_SIZE; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GRID_SIZE, y);
    ctx.stroke();
  }
}

// Draw a polygon
function drawPolygon(polygon) {
  const [posX, posY] = polygon.position;
  
  // Draw polygon shape
  ctx.fillStyle = polygon.color;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  const firstVertex = polygon.vertices[0];
  ctx.moveTo(posX + firstVertex[0], posY + firstVertex[1]);
  
  for (let i = 1; i < polygon.vertices.length; i++) {
    const vertex = polygon.vertices[i];
    ctx.lineTo(posX + vertex[0], posY + vertex[1]);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw cities
  ctx.fillStyle = 'black';
  for (const city of polygon.cities) {
    ctx.beginPath();
    ctx.arc(posX + city.x, posY + city.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw ID label
  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.fillText(`P${polygon.id}`, posX + 5, posY + 15);
}

// Draw connections between cities
function drawConnections() {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  
  for (const polygon of placedPolygons) {
    const [posX, posY] = polygon.position;
    
    for (const city of polygon.cities) {
      for (const connection of city.connections) {
        // Parse target ID to find polygon ID and city index
        const [targetPolyId, targetCityIdx] = connection.targetId.split('-');
        
        // Find the target polygon
        const targetPolygon = placedPolygons.find(p => p.id.toString() === targetPolyId);
        if (targetPolygon) {
          // Find the specific target city
          const targetCity = targetPolygon.cities.find(c => c.id === connection.targetId);
          if (targetCity) {
            const [targetPosX, targetPosY] = targetPolygon.position;
            
            // Draw connection line with thickness based on weight
            ctx.lineWidth = Math.min(connection.weight, 5);
            ctx.beginPath();
            ctx.moveTo(posX + city.x, posY + city.y);
            ctx.lineTo(targetPosX + targetCity.x, targetPosY + targetCity.y);
            ctx.stroke();
            
            // Draw weight label
            const midX = (posX + city.x + targetPosX + targetCity.x) / 2;
            const midY = (posY + city.y + targetPosY + targetCity.y) / 2;
            ctx.fillStyle = 'blue';
            ctx.font = '10px Arial';
            ctx.fillText(connection.weight.toString(), midX, midY);
          }
        }
      }
    }
  }
}

// Main render function
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  drawGrid();
  
  // Draw placed polygons
  for (const polygon of placedPolygons) {
    drawPolygon(polygon);
  }
  
  // Draw connections between cities
  drawConnections();
}

// Initialize the application
function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = GRID_SIZE;
  canvas.height = GRID_SIZE;
  
  // Setup UI controls
  document.getElementById('run-btn').addEventListener('click', () => {
    initializeGrid();
    generateSampleData();
    runPlacementAlgorithm();
    render();
  });
  
  // Initial setup
  initializeGrid();
  generateSampleData();
  runPlacementAlgorithm();
  render();
}

// Run the app when the page loads
window.onload = init;