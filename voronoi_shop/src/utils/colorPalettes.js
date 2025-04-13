/**
 * Color palettes for use in visualizations
 */

/**
 * Available color palettes with descriptive names
 */
export const colorPalettes = {
  // Muted earth tones for a cozy vibe
  muted: [
    '#d9c5a0', // beige
    '#8a9a5b', // sage green
    '#c19a6b', // light brown
    '#a4b494', // grayed green  
    '#7d6c46', // dark olive
    '#b5b8a3', // pale sage
    '#a98467', // medium brown
    '#718355', // forest green
    '#d8d4c4', // light beige
    '#84714f'  // dark tan
  ],
  
  // Sunset gradient colors for warmth
  sunset: [
    '#f9a03f', // orange
    '#e06377', // coral
    '#c83349', // red
    '#5c374c', // deep purple
    '#eb5e55', // salmon
    '#ff9e80', // peach
    '#d35269', // raspberry
    '#8a5082', // violet
    '#edad92', // light peach
    '#aa3e98'  // magenta
  ],
  
  // Monochromatic blues with contrast
  blues: [
    '#a4c3d2', // light blue
    '#7a9eb1', // medium blue
    '#5c7d99', // blue grey
    '#426a8c', // slate blue
    '#375673', // dark blue
    '#2a4158', // navy
    '#8fb5d5', // sky blue
    '#6a93ad', // steel blue
    '#b8d0e0', // pale blue  
    '#1e3648'  // dark navy
  ]
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