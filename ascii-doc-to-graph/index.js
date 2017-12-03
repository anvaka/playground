var forEachLine = require('./lib/forEachLine.js');
var inputFileName = process.argv[2];
var anchorRegex = /\[\[(.+?)\]\]/g;
var referenceRegex = /<<(.+?)>>/g;
var pageSizeInLines = 42; // assume 42 lines per page.

if (!inputFileName) {
  console.log('Please provide input asciidoc file');
  process.exit(-1);
}

var lineNumber = 0;
var currentPage = 1;
var anchors = new Map(); // anchor name to line number
var references = [];

forEachLine(inputFileName, line => {
  lineNumber += 1;
  if (lineNumber % pageSizeInLines === 0) currentPage += 1;

  forEachRegexMatch(anchorRegex, line, rememberAnchor);
  forEachRegexMatch(referenceRegex, line, rememberReference);
}).then(() => {
  console.log('digraph book {');
  var indent = '  ';
  for (var i = 2; i <= currentPage; ++i) {
    // first, connect all pages sequentially:
  //  console.log(`${indent}page_${i-1} -> page_${i}`);
  }
  // then connect references to pages:
  anchors.forEach((info, anchor) => {
    console.log(`${indent}${anchor};`);// -> page_${info.page}`);
  });

  // finally connect all references to anchors:
  references.forEach((referenceInfo) => {
    console.log(`${indent}page_${referenceInfo.page} -> ${referenceInfo.name}`);
  });
  console.log('}')
})

function forEachRegexMatch(regex, line, callback) {
  var match;
  while( (match = regex.exec(line) )) {
    callback(match[1]);
  }
}

function rememberAnchor(anchor) {
  if (anchors.has(anchor)) {
    throw new Error('How come this anchor appears twice? ' + anchor);
  }

  anchors.set(anchor, {lineNumber, page: currentPage});
}

function rememberReference(reference) {
  references.push({name: reference, lineNumber, page: currentPage});
}
