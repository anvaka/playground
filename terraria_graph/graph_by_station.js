const fs = require('fs');

const inputFilePath = process.argv[2];
const outputDirectory = process.argv[3] || './';
const stationColors = {
    'Work Bench': '#e6194B',
    'By Hand': '#3cb44b',
    'Shimmer': '#ffe119',
    'Sawmill': '#4363d8',
    'Iron Anvil': '#f58231',
};

function createDotFileForStation(recipes, station) {
    let dotFileContent = 'digraph G {\n';

    for (const recipe of recipes) {
        if (recipe.version || recipe.station !== station) continue;

        const result = recipe.result;
        for (const ingredient of recipe.ingredients) {
            const cleanedIngredient = ingredient.replace(/\u00a6/g, '');
            const edgeColor = stationColors[recipe.station] || 'black';
            dotFileContent += `  "${cleanedIngredient}" -> "${result}" [color="${edgeColor}"];\n`;
        }
    }

    dotFileContent += '}\n';
    return dotFileContent;
}

function processCraftingRecipes(recipes) {
    const stations = [...new Set(recipes.map(recipe => recipe.station))];

    for (const station of stations) {
        const dotContent = createDotFileForStation(recipes, station);
        const outputFilePath = `${outputDirectory}/${station.replace(/ /g, '_')}.dot`;

        fs.writeFile(outputFilePath, dotContent, (err) => {
            if (err) {
                console.error(`Error writing the output file for station ${station}:`, err);
                return;
            }
            console.log(`DOT file for station ${station} saved to ${outputFilePath}`);
        });
    }
}

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const recipes = JSON.parse(data);
    processCraftingRecipes(recipes);
});
