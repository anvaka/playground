/**
 * Color palettes for use in visualizations
 */

/**
 * Calculate the relative luminance of a color
 * @param {string} hexColor - Hex color string (e.g. '#ff0000')
 * @returns {number} - Luminance value between 0 (black) and 1 (white)
 */
function getLuminance(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Calculate relative luminance using the formula from WCAG 2.0
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Sort colors by luminance from darkest to lightest
 * @param {string[]} colors - Array of hex color strings
 * @returns {string[]} - Sorted array of hex color strings
 */
function sortColorsByLuminance(colors) {
  return [...colors].sort((a, b) => getLuminance(a) - getLuminance(b));
}

/**
 * Available color palettes with descriptive names
 */
export const colorPalettes = {
  // Muted earth tones for a cozy vibe
  muted: sortColorsByLuminance([
    '#d9c5a0', '#8a9a5b', '#c19a6b', '#a4b494', '#7d6c46', 
    '#b5b8a3', '#a98467', '#718355', '#d8d4c4', '#84714f'
  ]),
  
  // Sunset gradient colors for warmth
  sunset: sortColorsByLuminance([
    '#f9a03f', '#e06377', '#c83349', '#5c374c', '#eb5e55',
    '#ff9e80', '#d35269', '#8a5082', '#edad92', '#aa3e98'
  ]),
  
  // Monochromatic blues with contrast
  blues: sortColorsByLuminance([
    '#a4c3d2', '#7a9eb1', '#5c7d99', '#426a8c', '#375673', 
    '#2a4158', '#8fb5d5', '#6a93ad', '#b8d0e0', '#1e3648'
  ])
};

/**
 * Get a color from a palette by index
 * @param {string} paletteName - The name of the palette to use
 * @param {number} index - The index to retrieve
 * @returns {string} - A CSS color string
 */
export function getColorFromPalette(paletteName, index) {
  const palette = colorPalettes[paletteName] || colorPalettes.muted;
  return palette[index % palette.length];
}