const Annoy = require("annoy");
let annoyIndex;
let inFile = "./glove.twitter.27B.100d.txt";
inFile = './glove.6B.300d.txt'
const readline = require("readline");
let dimensions;
const commonWords = new RegExp(
  /\b(the|rt|be|to|t|s|http|https|’|is|“|didn|co|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|will|an|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|when|me|make|can|like|time|no|just|him|know|take|person|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/gi
);

const lineReader = require("readline").createInterface({
  input: require("fs").createReadStream(inFile)
});

let wordToIndex = new Map();
let indexToWord = [];
let rl;

lineReader
  .on("line", function(line) {
    let parts = line.split(" ");
    let index = wordToIndex.size;
    let word = parts[0];
    let vector = parts.slice(1, parts.length).map(x => Number.parseFloat(x));

    wordToIndex.set(word, index);
    indexToWord[index] = word;

    if (index === 0) {
      dimensions = vector.length;
      annoyIndex = new Annoy(dimensions, "Angular");
    }
    annoyIndex.addItem(index, vector);
  })
  .on("close", () => {
    annoyIndex.build();
    console.log("Index created");
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    fetchNext();
  });

function fetchNext() {
  rl.question("Enter the search phrase: ", answer => {
    printRelated(answer, 10);
    fetchNext();
  });
}

function printRelated(inputStr, count) {
  let inputPhrase = extractCleanText(inputStr);
  let input = transform(inputPhrase);
  let neighbors = annoyIndex.getNNsByVector(input.vector, count, -1, false);
  console.log(neighbors.map(idx => indexToWord[idx]).join("; "));
}

function transform(text) {
  let cleanText = extractCleanText(text);
  let com = [];
  let count = 0;
  for (var i = 0; i < dimensions; ++i) com[i] = 0;

  cleanText.split(" ").forEach(w => {
    const index = wordToIndex.get(w);
    if (index === undefined) return;
    const vector = annoyIndex.getItem(index);
    if (!vector) {
      console.log("No vector for " + w);
      return;
    }
    vector.forEach((v, idx) => {
      com[idx] += Math.cos(v);
    });
    count += 1;
  });

  return {
    text,
    vector: com.map(v => v / count)
  };
}

function extractCleanText(text) {
  if (!text) return "";

  let result = text
    .replace(/@(.+?)\b/g, " ")
    .replace(/#(.+?)\b/g, " ")
    .replace(commonWords, " ")
    .replace(/[.,\/#!$'"%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return result === " " ? "" : result;
}
