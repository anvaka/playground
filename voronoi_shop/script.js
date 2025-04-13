// Import services and modules
import { getCoffeeShops } from './src/coffeeShopService.js';
import { CanvasRenderer } from './src/renderer/canvasRenderer.js';
import { SVGRenderer } from './src/renderer/svgRenderer.js';
import { VoronoiMap } from './src/voronoi/voronoiMap.js';

// Constants
const RENDERER_TYPE = 'canvas'; // Change to 'canvas' to use canvas renderer
const COLOR_SCHEME = 'blues'; // Options: 'muted', 'sunset', 'blues'

// Initialize DOM elements
const statusDiv = document.getElementById('status');
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const containerElement = document.querySelector('.canvas-container');

// Create renderer based on type
let renderer;
if (RENDERER_TYPE === 'canvas') {
    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer = new CanvasRenderer(canvas);
} else {
    // Default to SVG renderer
    renderer = new SVGRenderer(document.body);
}

// Configure renderer and create Voronoi map
renderer.setColorScheme(COLOR_SCHEME);
const voronoiMap = new VoronoiMap(renderer);

// Handle window resize events
window.addEventListener('resize', () => {
  voronoiMap.handleResize(window.innerWidth, window.innerHeight);
});

/**
 * Update status message with type styling
 * @param {string} message - Message to display
 * @param {string} type - Message type (loading, success, error)
 */
function updateStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

/**
 * Fetch coffee shop data for the specified city
 * @param {string} cityName - Name of the city to search
 * @returns {Promise<Object>} - Coffee shop data
 */
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

// Set up form submit handler
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) {
        updateStatus('Please enter a city name', 'error');
        return;
    }
    
    try {
        const data = await fetchCoffeeShops(city);
        voronoiMap.setData(data, city).render();
    } catch (error) {
        console.error(error);
    }
});

// Initialize the visualization on page load
document.addEventListener('DOMContentLoaded', () => {
    voronoiMap.initialize();
});