// Grid-Based Polygon Layout Algorithm
import generator from 'https://esm.run/ngraph.generators';
import createForceLayout from 'https://esm.run/ngraph.forcelayout';
import * as miserables from 'https://esm.run/miserables';
import generateSampleCitiesInside from './generateSampleCitiesInside.js';

// const mGraph = generator.ladder(12);
const mGraph = generator.complete(5);
// const mGraph = miserables.create(5);
const availableShapes = {
  Rectangle: [[0, 0], [50, 0], [50, 30], [0, 30]],
  // Triangle: [[0, 0], [20, 40], [40, 0]],
  // Pentagon: [[25, 0], [50, 20], [40, 50], [10, 50], [0, 20]],
  // Square: [[0, 0], [20, 0], [20, 20], [0, 20]]
};

// Constants
const GRID_SIZE = 400;
const CELL_SIZE = 5;
const GRID_CELLS = GRID_SIZE / CELL_SIZE;
const LAYOUT_STEPS = 1000;
const POSITION_WEIGHT = 1.0;
const CONNECTED_WEIGHT = 1.0;
const DISCONNECTED_WEIGHT = 0.0;
const CENTER_WEIGHT = 0.0;

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
  const layout = createForceLayout(mGraph);
  for (let i = 0; i < LAYOUT_STEPS; i++) {
    layout.step();
  }
  let layoutBoundingBox = layout.getGraphRect();

  // Clear existing data
  polygons = [];
  placedPolygons = [];
  
  // Create sample polygons with proper city-to-city connections
  // Each city has a unique ID: polygonId-cityIndex
  mGraph.forEachNode(node => {
    const randomShape = Object.keys(availableShapes)[Math.floor(Math.random() * Object.keys(availableShapes).length)];
    const polygon = availableShapes[randomShape];
    const citiesInsidePolygon = generateSampleCitiesInside(node.id, polygon, 5);
    const fNode = createSamplePolygon(node.id, polygon, citiesInsidePolygon, `hsl(${Math.random() * 360}, 70%, 70%)`);
    fNode.initialPosition = getNormalizedPositionFromLayout(node.id);
    node.fNode = fNode;
    polygons.push(fNode);
  });

  // Now lets add connection between cities, so that they only connect to the cities inside other polygons
  // that is connected by the graph
  let numberOfCitiesToConnect = 3;
  mGraph.forEachLink(link => {
    const fromNode = mGraph.getNode(link.fromId);
    const toNode = mGraph.getNode(link.toId);
    const fromPolygon = fromNode.fNode;
    const toPolygon = toNode.fNode;
    for (let i = 0; i < numberOfCitiesToConnect; i++) {
      const fromCity = fromPolygon.cities[Math.floor(Math.random() * fromPolygon.cities.length)];
      const toCity = toPolygon.cities[Math.floor(Math.random() * toPolygon.cities.length)];
      fromCity.connections.push({targetId: `${toCity.id}`, weight: Math.floor(Math.random() * 10)});
      toCity.connections.push({targetId: `${fromCity.id}`, weight: Math.floor(Math.random() * 10)});
    }
  });

  function getNormalizedPositionFromLayout(nodeId) {
    const pos = layout.getNodePosition(nodeId);
    const margin = 20;
    let x = (pos.x - layoutBoundingBox.min_x - margin) / (2 * margin + layoutBoundingBox.max_x - layoutBoundingBox.min_x) * GRID_SIZE;
    let y = (pos.y - layoutBoundingBox.min_y - margin) / (2 * margin + layoutBoundingBox.max_y - layoutBoundingBox.min_y) * GRID_SIZE;
    return [Math.floor(x), Math.floor(y)];
  }
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
  const [initialX, initialY] = polygon.initialPosition;
  const distanceFromInitial = Math.sqrt(
    Math.pow(position[0] - initialX, 2) + 
    Math.pow(position[1] - initialY, 2)
  );
  
  // The closer to the initial position, the higher the value
  // Scale based on grid size and weight
  const positionValue = (GRID_SIZE / (distanceFromInitial + 1)) * POSITION_WEIGHT * 5;
  value += positionValue;
  
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
          value += CONNECTED_WEIGHT * (connection.weight * 1000) / (distance + 1);
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
      value -= DISCONNECTED_WEIGHT * (4000 / (distance + 1));
    }
  }
  
  // Proximity to grid center (slight preference for central placement)
  const centerX = GRID_SIZE / 2;
  const centerY = GRID_SIZE / 2;
  const distanceToCenter = Math.sqrt(
    Math.pow(position[0] - centerX, 2) + 
    Math.pow(position[1] - centerY, 2)
  );
  
  value += CENTER_WEIGHT * 1000 / (distanceToCenter + 1);
  
  return value;
}

// Place polygon on the grid at a specific position
function placePolygon(polygon, position) {
  if (!Number.isFinite(polygon.id)) {
    throw new Error('Invalid polygon ID - expected a number, got ' + polygon.id);
  }

  const [posX, posY] = position;
  polygon.position = [posX, posY];
  polygon.placed = true;
  placedPolygons.push(polygon);
  
  // Mark cells as occupied
  const occupiedCells = getOccupiedCells(polygon, position);
  for (const [x, y] of occupiedCells) {
    grid[y][x] = polygon.id + 1; // avoid 0. 0 is reserved for empty cells
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
    placePolygon(firstPolygon, firstPolygon.initialPosition);
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
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  
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