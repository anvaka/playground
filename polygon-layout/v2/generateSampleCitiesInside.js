function isPointInsidePolygon(point, polygon) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    
    if (intersect) {
      isInside = !isInside;
    }
  }
  
  return isInside;
}

function getBoundingBox(polygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of polygon) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [[minX, minY], [maxX, maxY]];
}

export default function generateSampleCitiesInside(polygonId, polygon, citiesToSample) {
  const boundingBox = getBoundingBox(polygon);
  const minX = boundingBox[0][0];
  const minY = boundingBox[0][1];
  const maxX = boundingBox[1][0];
  const maxY = boundingBox[1][1];
  let cities = [];
  do {
    const x = Math.round(Math.random() * (maxX - minX) + minX);
    const y = Math.round(Math.random() * (maxY - minY) + minY);
    if (isPointInsidePolygon([x, y], polygon)) {
      cities.push({
        id: `${polygonId}-${cities.length}`,
        x, y,
        connections: []
      });
    }
  } while (cities.length < citiesToSample);

  return cities;
}
