/**
 * Utility for transforming geographic coordinates to canvas coordinates
 */
export class GeoTransformer {
  constructor(bbox, canvasWidth, canvasHeight, margin = 50) {
    this.bbox = bbox;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.margin = margin;
    this.calculateTransformation();
  }

  calculateTransformation() {
    const { bbox, margin, canvasWidth, canvasHeight } = this;
    const mapWidth = canvasWidth - margin * 2;
    const mapHeight = canvasHeight - margin * 2;
    
    // Add consistent padding to the bounding box (15% on each side)
    const padding = 0.15;
    const lonSpan = bbox.east - bbox.west;
    const latSpan = bbox.north - bbox.south;
    
    this.paddedBbox = {
      west: bbox.west - lonSpan * padding,
      east: bbox.east + lonSpan * padding,
      south: bbox.south - latSpan * padding,
      north: bbox.north + latSpan * padding
    };

    // Recalculate spans with padding
    const paddedLonSpan = this.paddedBbox.east - this.paddedBbox.west;
    const paddedLatSpan = this.paddedBbox.north - this.paddedBbox.south;

    // Adjust for Earth's curvature
    const midLat = (this.paddedBbox.north + this.paddedBbox.south) / 2;
    const latRadians = midLat * Math.PI / 180;
    this.lonCorrectionFactor = Math.cos(latRadians);
    
    // Corrected span
    const correctedLonSpan = paddedLonSpan * this.lonCorrectionFactor;
    
    // Calculate aspect ratio of the geographic area (corrected for Earth's curvature)
    const geoAspectRatio = correctedLonSpan / paddedLatSpan;
    const canvasAspectRatio = mapWidth / mapHeight;
    
    // Set up projection based on aspect ratios
    if (geoAspectRatio > canvasAspectRatio) {
      // Width constrains the map
      this.xScale = mapWidth / correctedLonSpan;
      this.yScale = this.xScale; 
    } else {
      // Height constrains the map
      this.yScale = mapHeight / paddedLatSpan;
      this.xScale = this.yScale;
    }
    
    // Calculate offsets to center the map
    const correctedWidth = correctedLonSpan * this.xScale;
    const correctedHeight = paddedLatSpan * this.yScale;
    
    this.xOffset = margin + (mapWidth - correctedWidth) / 2;
    this.yOffset = margin + (mapHeight - correctedHeight) / 2;
  }

  // Convert geo coordinates to canvas coordinates with proper aspect ratio
  geoToCanvas(lon, lat) {
    const x = this.xOffset + (lon - this.paddedBbox.west) * this.xScale * this.lonCorrectionFactor;
    const y = this.yOffset + (this.paddedBbox.north - lat) * this.yScale; // Invert y-axis
    return [x, y];
  }
}