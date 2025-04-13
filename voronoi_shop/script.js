// Import services and modules
import { getCoffeeShops } from './src/coffeeShopService.js';
import { CanvasRenderer } from './src/renderer/canvasRenderer.js';
import { VoronoiMap } from './src/voronoi/voronoiMap.js';

// Global elements
const canvas = document.getElementById('voronoi-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const statusDiv = document.getElementById('status');
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city');

// Create renderer and voronoi map
const renderer = new CanvasRenderer(canvas);
// renderer.setColorScheme('sunset');
renderer.setColorScheme('blues');
const voronoiMap = new VoronoiMap(renderer);

// Handle window resize events
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  voronoiMap.handleResize(newWidth, newHeight);
});

// Function to update status with message
function updateStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = type;
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
        voronoiMap.setData(data, city).render();
    } catch (error) {
        console.error(error);
        // Status already updated in fetchCoffeeShops function
    }
});

// Initialize the visualization on page load
document.addEventListener('DOMContentLoaded', () => {
    voronoiMap.initialize();
});