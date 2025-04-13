/**
 * Utility functions for creating canvas path from GeoJSON data
 */

/**
 * Create a clip path from GeoJSON data
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} geoJson - The GeoJSON data
 * @param {Function} transformFn - Function to transform geo coordinates
 */
export function createClipPathFromGeoJSON(ctx, geoJson, transformFn) {
  if (!geoJson) return;
  
  // Handle different GeoJSON formats
  if (geoJson.type === 'FeatureCollection') {
    geoJson.features.forEach(feature => {
      if (feature.geometry) {
        addGeometryToPath(ctx, feature.geometry, transformFn);
      }
    });
  } else if (geoJson.type === 'Feature') {
    if (geoJson.geometry) {
      addGeometryToPath(ctx, geoJson.geometry, transformFn);
    }
  } else {
    // Direct geometry object
    addGeometryToPath(ctx, geoJson, transformFn);
  }
}

/**
 * Add geometry to the current path
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} geometry - GeoJSON geometry object
 * @param {Function} transformFn - Function to transform coordinates
 */
function addGeometryToPath(ctx, geometry, transformFn) {
  if (geometry.type === 'Polygon') {
    // Add the outer ring to the path
    addRingToPath(ctx, geometry.coordinates[0], transformFn);
    
    // Add holes (inner rings) in reverse order to create proper mask
    for (let i = 1; i < geometry.coordinates.length; i++) {
      addRingToPath(ctx, geometry.coordinates[i], transformFn, true);
    }
  } else if (geometry.type === 'MultiPolygon') {
    // Process each polygon in the multipolygon
    geometry.coordinates.forEach(polygon => {
      // Add outer ring
      addRingToPath(ctx, polygon[0], transformFn);
      
      // Add holes
      for (let i = 1; i < polygon.length; i++) {
        addRingToPath(ctx, polygon[i], transformFn, true);
      }
    });
  }
}

/**
 * Add a ring to the current path
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} ring - Array of coordinates for the ring
 * @param {Function} transformFn - Function to transform coordinates
 * @param {boolean} isHole - Whether this ring is a hole (inner ring)
 */
function addRingToPath(ctx, ring, transformFn, isHole = false) {
  if (!ring || ring.length === 0) return;
  
  // For holes, we need to go in the opposite direction
  const orderedRing = isHole ? [...ring].reverse() : ring;
  
  const start = transformFn(orderedRing[0][0], orderedRing[0][1]);
  ctx.moveTo(start[0], start[1]);
  
  for (let i = 1; i < orderedRing.length; i++) {
    const point = transformFn(orderedRing[i][0], orderedRing[i][1]);
    ctx.lineTo(point[0], point[1]);
  }
  
  ctx.closePath();
}

/**
 * Draw geometry from GeoJSON
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} geometry - GeoJSON geometry object
 * @param {Function} transformFn - Function to transform coordinates
 */
export function drawGeometry(ctx, geometry, transformFn) {
  ctx.beginPath();
  
  if (geometry.type === 'Polygon') {
    // Draw the outer ring of the polygon
    drawRing(ctx, geometry.coordinates[0], transformFn);
    
    // Draw any holes (inner rings)
    for (let i = 1; i < geometry.coordinates.length; i++) {
      drawRing(ctx, geometry.coordinates[i], transformFn);
    }
  } else if (geometry.type === 'MultiPolygon') {
    // Draw each polygon in the multipolygon
    geometry.coordinates.forEach(polygon => {
      // Draw the outer ring
      drawRing(ctx, polygon[0], transformFn);
      
      // Draw any holes
      for (let i = 1; i < polygon.length; i++) {
        drawRing(ctx, polygon[i], transformFn);
      }
    });
  } else if (geometry.type === 'Point') {
    const point = transformFn(geometry.coordinates[0], geometry.coordinates[1]);
    ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
  }
  
  ctx.stroke();
}

/**
 * Draw a ring (polygon boundary or hole)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} ring - Array of coordinates for the ring
 * @param {Function} transformFn - Function to transform coordinates
 */
function drawRing(ctx, ring, transformFn) {
  if (!ring || ring.length === 0) return;
  
  const start = transformFn(ring[0][0], ring[0][1]);
  ctx.moveTo(start[0], start[1]);
  
  for (let i = 1; i < ring.length; i++) {
    const point = transformFn(ring[i][0], ring[i][1]);
    ctx.lineTo(point[0], point[1]);
  }
  
  ctx.closePath();
}