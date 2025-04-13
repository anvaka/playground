/**
 * Utility for transforming geographic coordinates to canvas coordinates
 * with proper scaling and aspect ratio preservation
 */
export class GeoTransformer {
  constructor(bbox, canvasWidth, canvasHeight, margin = 50) {
    this.bbox = bbox;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.margin = margin;
    this.calculateTransformation();
  }

  /**
   * Calculate the transformation parameters for geo to canvas conversion
   */
  calculateTransformation() {
    const { bbox, margin, canvasWidth, canvasHeight } = this;
    const mapWidth = canvasWidth - margin * 2;
    const mapHeight = canvasHeight - margin * 2;
    
    // Add padding to the bounding box (15%)
    const padding = 0.15;
    const lonSpan = bbox.east - bbox.west;
    const latSpan = bbox.north - bbox.south;
    
    this.paddedBbox = {
      west: bbox.west - lonSpan * padding,
      east: bbox.east + lonSpan * padding,
      south: bbox.south - latSpan * padding,
      north: bbox.north + latSpan * padding
    };

    // Calculate spans with padding
    const paddedLonSpan = this.paddedBbox.east - this.paddedBbox.west;
    const paddedLatSpan = this.paddedBbox.north - this.paddedBbox.south;

    // Adjust for Earth's curvature at this latitude
    const midLat = (this.paddedBbox.north + this.paddedBbox.south) / 2;
    const latRadians = midLat * Math.PI / 180;
    this.lonCorrectionFactor = Math.cos(latRadians);
    
    // Longitude span corrected for Earth's curvature
    const correctedLonSpan = paddedLonSpan * this.lonCorrectionFactor;
    
    // Calculate aspect ratios to maintain proper scaling
    const geoAspectRatio = correctedLonSpan / paddedLatSpan;
    const canvasAspectRatio = mapWidth / mapHeight;
    
    // Set scaling factors based on which dimension constrains the map
    if (geoAspectRatio > canvasAspectRatio) {
      // Width is the constraint
      this.xScale = mapWidth / correctedLonSpan;
      this.yScale = this.xScale; 
    } else {
      // Height is the constraint
      this.yScale = mapHeight / paddedLatSpan;
      this.xScale = this.yScale;
    }
    
    // Calculate offsets to center the map
    const correctedWidth = correctedLonSpan * this.xScale;
    const correctedHeight = paddedLatSpan * this.yScale;
    
    this.xOffset = margin + (mapWidth - correctedWidth) / 2;
    this.yOffset = margin + (mapHeight - correctedHeight) / 2;
  }

  /**
   * Convert geographic coordinates to canvas coordinates
   * @param {number} lon - Longitude
   * @param {number} lat - Latitude
   * @returns {Array} [x, y] canvas coordinates
   */
  geoToCanvas(lon, lat) {
    const x = this.xOffset + (lon - this.paddedBbox.west) * this.xScale * this.lonCorrectionFactor;
    // Invert y-axis since canvas y increases downward but latitude increases upward
    const y = this.yOffset + (this.paddedBbox.north - lat) * this.yScale;
    return [x, y];
  }
}