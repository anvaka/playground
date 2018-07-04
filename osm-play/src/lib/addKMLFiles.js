var tinyxml = require('tiny.xml')

export default function addKMLFiles(fileList) {
  const pendingFiles = [];
  for (let i = 0; i < fileList.length; ++i) {
    let fileEntry = fileList[i];
    pendingFiles.push(parseFile(fileEntry));
  }

  return Promise.all(pendingFiles).then(x => {
    console.log(x);
  });
}


function parseFile(file) {
  return new Promise(resolve => {
    var reader = new FileReader();
    reader.onload = function(){
      var kmlXMLString = reader.result;
      var parser = tinyxml(kmlXMLString)
      var lineStrings = parser.selectNodes('LineString');
      let paths = [];
      lineStrings.forEach(lineNode => {
        let c = lineNode.querySelector('coordinates');
        paths.push(c.textContent);
      })
      console.log(lineStrings);

      resolve({
        name:file.name,
        paths: paths
      });
    };
    reader.readAsText(file);
  });
}