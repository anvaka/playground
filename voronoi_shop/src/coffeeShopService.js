// Coffee shop data fetching service using OpenStreetMap APIs

/**
 * Gets coffee shops for a given city name using OpenStreetMap APIs
 * @param {string} cityName - The name of the city to search
 * @returns {Promise<Object>} - Object containing shops data, bounding box, and city geojson
 */
export async function getCoffeeShops(cityName) {
    try {
        // First, get the city boundaries from Nominatim API
        const cityData = await fetchCityData(cityName);
        
        if (!cityData) {
            throw new Error(`City "${cityName}" not found`);
        }
        
        // Extract boundary information
        const boundary = extractBoundary(cityData);
        
        // Get coffee shops using Overpass API
        const shops = await fetchCoffeeShopsInBoundary(boundary);
        
        return {
            shops,
            bbox: {
                south: boundary.bbox[0],
                west: boundary.bbox[1],
                north: boundary.bbox[2],
                east: boundary.bbox[3]
            },
            cityGeojson: cityData.geojson
        };
    } catch (error) {
        console.error('Error fetching coffee shops:', error);
        throw error;
    }
}

/**
 * Fetch city data from Nominatim API
 * @param {string} cityName - Name of the city
 * @returns {Promise<Object>} - City data
 */
async function fetchCityData(cityName) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&polygon_geojson=1`;
    const response = await fetch(nominatimUrl);
    
    if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

/**
 * Extract boundary information from Nominatim result
 * @param {Object} cityData - City data from Nominatim
 * @returns {Object} - Boundary information
 */
function extractBoundary(cityData) {
    let areaId = null;
    
    // Calculate area ID based on OSM object type
    if (cityData.osm_type === 'relation') {
        // For relations, add 3600000000 to OSM ID
        areaId = cityData.osm_id + 36e8;
    } else if (cityData.osm_type === 'way') {
        // For ways, add 2400000000 to OSM ID
        areaId = cityData.osm_id + 24e8;
    }
    
    // Extract bounding box
    const bbox = cityData.boundingbox ? [
        Number.parseFloat(cityData.boundingbox[0]), // south
        Number.parseFloat(cityData.boundingbox[2]), // west
        Number.parseFloat(cityData.boundingbox[1]), // north
        Number.parseFloat(cityData.boundingbox[3]), // east
    ] : null;
    
    return {
        areaId,
        bbox,
        name: cityData.display_name
    };
}

/**
 * Fetch coffee shops within a boundary using Overpass API
 * @param {Object} boundary - Boundary information
 * @returns {Promise<Array>} - Array of coffee shops
 */
async function fetchCoffeeShopsInBoundary(boundary) {
    const overpassApiUrl = "https://overpass-api.de/api/interpreter";
    const timeout = 90; // seconds
    const maxHeapSize = 1073741824; // 1GB
    
    let query;
    
    // Construct query based on available boundary information
    if (boundary.areaId) {
        // Use area ID for more precise boundary
        query = `[timeout:${timeout}][maxsize:${maxHeapSize}][out:json];
area(${boundary.areaId});
(._; )->.area;
node["amenity"="cafe"](area.area);
out body;`;
    } else if (boundary.bbox) {
        // Fall back to bounding box
        query = `[timeout:${timeout}][maxsize:${maxHeapSize}][bbox:${boundary.bbox.join(',')}][out:json];
node["amenity"="cafe"];
out body;`;
    } else {
        throw new Error('No valid boundary information available');
    }
    
    // Execute Overpass query
    const response = await fetch(overpassApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
        throw new Error(`No coffee shops found`);
    }
    
    return data.elements;
}