module.exports = getVectors;

const english = require("./english").join("|");
const commonWords = new RegExp("\\b(" + english + ")\\b", "gi");

function getVectors(index, text) {
  let cleanText = extractCleanText(text);

  return cleanText.split(" ").map(word => {
    return {
      word,
      vector: index.getVector(word)
    };
  });

  return [];
}

function extractCleanText(text) {
  if (!text) return "";

  let result = text
    .replace(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
      ""
    )
    .replace(/\d+/g, "")
    .replace(/[/|*]/g, " ")
    .replace(/["!·•'%”#$%&’()*+,-./:;<=>?̶@[\]^_`{|}~\\]/g, "")
    .replace(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      ""
    ) //emoji
    // .replace(commonWords, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return result === " " ? "" : result;
}
