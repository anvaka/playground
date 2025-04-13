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
    const boundaries = extractBoundaries([city])[0];
    
    // Query Overpass API for coffee shops using area ID or bounding box
    const overpassApiUrl = "https://overpass-api.de/api/interpreter";
    const timeout = 90; // seconds
    const maxHeapByteSize = 1073741824; // 1GB
    
    let query;
    if (boundaries.areaId) {
        // Use area ID for more precise boundary
        query = `[timeout:${timeout}][maxsize:${maxHeapByteSize}][out:json];
area(${boundaries.areaId});
(._; )->.area;
node["amenity"="cafe"](area.area);
out body;`;
    } else if (boundaries.bbox) {
        // Fallback to bounding box
        const bbox = serializeBBox(boundaries.bbox);
        query = `[timeout:${timeout}][maxsize:${maxHeapByteSize}][bbox:${bbox}][out:json];
node["amenity"="cafe"];
out body;`;
    } else {
        throw new Error(`Could not determine boundaries for ${cityName}`);
    }
    
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
        bbox: boundaries.bbox ? {
            south: boundaries.bbox[0],
            west: boundaries.bbox[1],
            north: boundaries.bbox[2],
            east: boundaries.bbox[3]
        } : null,
        cityGeojson: city.geojson
    };
}

/**
 * Extracts boundary information from Nominatim API results
 * @param {Array} results - Array of results from Nominatim API
 * @returns {Array} - Array of boundary objects with areaId and bbox
 */
function extractBoundaries(results) {
    return results.map(row => {
        let areaId, bbox;
        if (row.osm_type === 'relation') {
            // By convention the area id can be calculated from an existing relation
            // by adding 3600000000 to its OSM id
            areaId = row.osm_id + 36e8;
        } else if (row.osm_type === 'way') {
            // For ways, add 2400000000 to the OSM id
            areaId = row.osm_id + 24e8;
        }
        
        if (row.boundingbox) {
            bbox = [
                Number.parseFloat(row.boundingbox[0]),
                Number.parseFloat(row.boundingbox[2]),
                Number.parseFloat(row.boundingbox[1]),
                Number.parseFloat(row.boundingbox[3]),
            ];
        }

        return {
            areaId,
            bbox,
            lat: row.lat,
            lon: row.lon,
            osmId: row.osm_id,
            osmType: row.osm_type,
            name: row.display_name,
            type: row.type,
        };
    });
}

/**
 * Converts a bounding box array to a string format for Overpass API
 * @param {Array} bbox - Bounding box [south, west, north, east]
 * @returns {string} - Serialized bounding box string
 */
function serializeBBox(bbox) {
    return bbox.join(',');
}