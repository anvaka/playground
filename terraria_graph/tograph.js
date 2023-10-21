const fs = require('fs');

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3] || 'output.dot';
const stationColors = {
    'Work Bench': '#e6194B',    // Red
    'By Hand': '#3cb44b',      // Green
    'Shimmer': '#ffe119',      // Yellow
    'Sawmill': '#4363d8',      // Blue
    'Iron Anvil': '#f58231',   // Orange
    // Any other station not specified here will default to black
};

function processCraftingRecipes(recipes) {
    let dotFileContent = 'digraph G {\n';

    let stations = new Map();
    for (const recipe of recipes) {
        if (recipe.version) continue; // Skip the version specific recipes.

        stations.set(recipe.station, (stations.get(recipe.station) || 0) + 1);
        const result = recipe.result;

        for (const ingredient of recipe.ingredients) {
            const cleanedIngredient = ingredient.replace(/\u00a6/g, ''); // Remove the Unicode characters
            const edgeColor = stationColors[recipe.station] || 'black';  // Default to black if no color is found for a station
            dotFileContent += `  "${cleanedIngredient}" -> "${result}" [label="${recipe.station}", color="${edgeColor}"];\n`;
        }
    }

    // console.log('Stations:', Array.from(stations).sort((a, b) => b[1] - a[1]));
    dotFileContent += '}\n';

    return dotFileContent;
}

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const recipes = JSON.parse(data);
    const dotContent = processCraftingRecipes(recipes);

    fs.writeFile(outputFilePath, dotContent, (err) => {
        if (err) {
            console.error('Error writing the output file:', err);
            return;
        }
        console.log(`DOT file saved to ${outputFilePath}`);
    });
});
