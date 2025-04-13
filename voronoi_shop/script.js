// Import the extracted coffee shop service
import { getCoffeeShops } from './src/coffeeShopService.js';

// Global variables
const canvas = document.getElementById('voronoi-canvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city');

// Function to update status with message
function updateStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

// Initialize canvas
function initCanvas() {
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw welcome text
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Enter a city name to see coffee shop Voronoi diagram', canvas.width/2, canvas.height/2);
}

// Function to get coffee shops from coffee shop service
async function fetchCoffeeShops(cityName) {
    updateStatus(`Searching for coffee shops in ${cityName}...`);
    
    try {
        const data = await getCoffeeShops(cityName);
        updateStatus(`Found ${data.shops.length} coffee shops in ${cityName}`, 'success');
        return data;
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Function to generate and draw Voronoi diagram
function drawVoronoi(coffeeShops, bbox, cityGeojson) {
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale and offset to map geographic coordinates to canvas
    const margin = 50;
    const mapWidth = canvas.width - margin * 2;
    const mapHeight = canvas.height - margin * 2;
    
    // Add consistent padding to the bounding box (15% on each side)
    const padding = 0.15;
    const lonSpan = bbox.east - bbox.west;
    const latSpan = bbox.north - bbox.south;
    const paddedBbox = {
        west: bbox.west - lonSpan * padding,
        east: bbox.east + lonSpan * padding,
        south: bbox.south - latSpan * padding,
        north: bbox.north + latSpan * padding
    };

    // Recalculate spans with padding
    const paddedLonSpan = paddedBbox.east - paddedBbox.west;
    const paddedLatSpan = paddedBbox.north - paddedBbox.south;

    // Adjust for Earth's curvature
    const midLat = (paddedBbox.north + paddedBbox.south) / 2;
    const latRadians = midLat * Math.PI / 180;
    const lonCorrectionFactor = Math.cos(latRadians);
    
    // Corrected span
    const correctedLonSpan = paddedLonSpan * lonCorrectionFactor;
    
    // Calculate aspect ratio of the geographic area (corrected for Earth's curvature)
    const geoAspectRatio = correctedLonSpan / paddedLatSpan;
    const canvasAspectRatio = mapWidth / mapHeight;
    
    // Set up projection based on aspect ratios
    let xScale, yScale;
    
    if (geoAspectRatio > canvasAspectRatio) {
        // Width constrains the map
        xScale = mapWidth / correctedLonSpan;
        yScale = xScale; 
    } else {
        // Height constrains the map
        yScale = mapHeight / paddedLatSpan;
        xScale = yScale;
    }
    
    // Calculate offsets to center the map
    const correctedWidth = correctedLonSpan * xScale;
    const correctedHeight = paddedLatSpan * yScale;
    
    const xOffset = margin + (mapWidth - correctedWidth) / 2;
    const yOffset = margin + (mapHeight - correctedHeight) / 2;
    
    // Function to convert geo coordinates to canvas coordinates with proper aspect ratio
    function geoToCanvas(lon, lat) {
        const x = xOffset + (lon - paddedBbox.west) * xScale * lonCorrectionFactor;
        const y = yOffset + (paddedBbox.north - lat) * yScale; // Invert y-axis
        return [x, y];
    }
    
    // Draw city outline if GeoJSON is available
    if (cityGeojson) {
        ctx.strokeStyle = '#006600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let coordinates = [];
        
        // Extract coordinates based on GeoJSON type
        if (cityGeojson.type === 'Polygon') {
            coordinates = cityGeojson.coordinates[0]; // Outer ring
        } else if (cityGeojson.type === 'MultiPolygon') {
            // Just use the first polygon for simplicity
            coordinates = cityGeojson.coordinates[0][0];
        } else if (cityGeojson.type === 'Point') {
            // If only a point is available, draw a circle
            const point = geoToCanvas(cityGeojson.coordinates[0], cityGeojson.coordinates[1]);
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw the city outline polygon
        if (coordinates.length > 0) {
            coordinates.forEach((coord, index) => {
                const point = geoToCanvas(coord[0], coord[1]);
                if (index === 0) {
                    ctx.moveTo(point[0], point[1]);
                } else {
                    ctx.lineTo(point[0], point[1]);
                }
            });
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Extract coordinates for coffee shops
    const points = coffeeShops.map(shop => {
        return [shop.lon, shop.lat];
    });
    
    const scaledPoints = points.map(point => geoToCanvas(point[0], point[1]));
    
    // Generate Voronoi diagram using D3
    const voronoi = d3.Delaunay
        .from(scaledPoints)
        .voronoi([0, 0, canvas.width, canvas.height]);
    
    // Draw Voronoi cells
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < scaledPoints.length; i++) {
        // Get the cell polygon
        const cell = voronoi.cellPolygon(i);
        
        if (cell) {
            // Draw the cell
            ctx.beginPath();
            cell.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point[0], point[1]);
                } else {
                    ctx.lineTo(point[0], point[1]);
                }
            });
            ctx.closePath();
            
            // Fill with a semi-transparent color
            ctx.fillStyle = `hsla(${(i * 137) % 360}, 70%, 70%, 0.3)`;
            ctx.fill();
            ctx.stroke();
        }
    }
    
    // Draw coffee shop points
    ctx.fillStyle = '#FF0000';
    scaledPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw legend
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Coffee Shops in ${cityInput.value}: ${coffeeShops.length}`, margin, 30);
    
    // Draw red dot for legend
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(margin + 200, 26, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw legend text for coffee shop points
    ctx.fillStyle = '#000000';
    ctx.fillText('Coffee Shop', margin + 210, 30);
    
    // Add city outline to legend
    ctx.strokeStyle = '#006600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin + 280, 26);
    ctx.lineTo(margin + 320, 26);
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.fillText('City Outline', margin + 330, 30);
}

// Form submit handler
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) {
        updateStatus('Please enter a city name', 'error');
        return;
    }
    
    try {
        const data = await fetchCoffeeShops(city);
        drawVoronoi(data.shops, data.bbox, data.cityGeojson);
    } catch (error) {
        console.error(error);
        // Status already updated in fetchCoffeeShops function
    }
});

// Initialize the canvas on page load
document.addEventListener('DOMContentLoaded', initCanvas);