const fs = require('fs');
const readline = require('readline');
const test = require('tap');

const inputProgram = process.argv[2] || './remove_duplicates.js';
const inputFile = process.argv[3] || './data/sorted_array_remove_dups.tsv';

const testCode = require(inputProgram);

const rd = readline.createInterface({
    input: fs.createReadStream(inputFile),
    console: false
});


let isFirst = true;
let schema;

rd.on('line', function(line) {
    if (isFirst) {
        schema = readSchema(line);
        isFirst = false;
        return;
    }

    let inOut = schema(line);
    try {
        let actualOutput = testCode(inOut.input);
        test.same(inOut.output, actualOutput);
    } catch (err) {
        console.log('Failed on ', line, err);
    }
});

function readSchema(line) {
    const inOut = line.split('\t');
    let inputReader = getTypeReader(inOut[0]);
    let outputReader = getTypeReader(inOut[1]);

    return function (line) {
        let parts = line.split('\t');
        let input = inputReader(parts[0]);
        let output = outputReader(parts[1]);
        return {input, output};
    }
}

function getTypeReader(/* typeDef */) {
    return JSON.parse.bind(JSON);
    // if (typeDef.match(/array\(.+\)/) return l 
}
