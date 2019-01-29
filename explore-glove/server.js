const express = require("express");
const app = express();
const port = 3000;
const getVectors = require("./getVectors");
const initIndex = require("./initIndex");

var bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies

app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);

initIndex().then(wordIndex => {
  console.log("index created. Starting the server");
  app.get("/vectors", (req, res) => {
    let input = req.query.text;
    let vectors = getVectors(wordIndex, input);
    res.send(JSON.stringify(vectors));
  });
  app.post("/nn", (req, res) => {
    const vector = req.body.vector;
    let nearest = wordIndex.findNearest(vector, 10);
    res.send(JSON.stringify({ nearest }));
  });
  app.use(express.static("public"));
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});
