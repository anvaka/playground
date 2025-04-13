// Coffee shop data fetching service

/**
 * Gets coffee shops for a given city name using OpenStreetMap APIs
 * @param {string} cityName - The name of the city to search
 * @returns {Promise<Object>} - Object containing shops data, bounding box, and city geojson
 */
export async function getCoffeeShops(cityName) {
    // First, get the city boundaries from Nominatim API
    const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&polygon_geojson=1`);
    const nominatimData = await nominatimResponse.json();
    
    if (!nominatimData || nominatimData.length === 0) {
        throw new Error(`City "${cityName}" not found`);
    }
    
    const city = nominatimData[0];
    
    // Calculate a bounding box around the city's center
    // This is a simplification - a proper implementation would use the city's actual boundary
    const bbox = {
        south: parseFloat(city.boundingbox[0]),
        west: parseFloat(city.boundingbox[2]),
        north: parseFloat(city.boundingbox[1]),
        east: parseFloat(city.boundingbox[3])
    };
    
    // Query Overpass API for coffee shops within the bounding box
    const overpassApiUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json];
        node["amenity"="cafe"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        out body;
    `;
    
    const response = await fetch(overpassApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
        throw new Error(`No coffee shops found in ${cityName}`);
    }
    
    return {
        shops: data.elements,
        bbox: bbox,
        cityGeojson: city.geojson
    };
}