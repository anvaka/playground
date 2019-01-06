var os = require("os");
var path = require("path");
var fs = require("fs");
var { execSync } = require("child_process");

var saveToDir = os.tmpdir();
var hours = ["00", "06", "12", "18"];

var d = new Date(2018, 0);
// d = new Date(2018, 2, 28) - apr 9 - missing;
d = new Date(2018, 5, 12);
var year = d.getFullYear();
do {
  saveJson(year, d.getMonth() + 1, d.getDate());
  d.setDate(d.getDate() + 1);
  year = d.getFullYear();
} while (year < 2019);

function saveJson(year, month, day) {
  if (month < 10) month = "0" + ("" + month);
  if (day < 10) day = "0" + ("" + day);
  for (var i = 0; i < hours.length; ++i) {
    var HH = hours[i];
    var fileName = `gfsanl_4_${year}${month}${day}_${HH}00_000.grb2`;
    let url = `https://nomads.ncdc.noaa.gov/data/gfsanl/${year}${month}/${year}${month}${day}/${fileName}`;
    console.log("downloading " + url);
    var nodeFileName = `${year}${month}${day}${HH}.json`;

    var fullFileName = path.join(saveToDir, fileName);
    var uFileName = fullFileName + "u";
    var vFileName = fullFileName + "v";

    try {
      execSync(`curl "${url}" > ${fullFileName}`);
      execSync(`grib_copy -w shortName=10u ${fullFileName} ${uFileName}`);
      execSync(`grib_copy -w shortName=10v ${fullFileName} ${vFileName}`);
    } catch (e) {
      console.log("Failed to download ", url);
      console.log(e);
      continue;
    }

    var buff = execSync(
      `printf "{\\"u\\":\`grib_dump -j ${uFileName}\`,\\"v\\":\`grib_dump -j ${vFileName}\`}"`
    );
    var content = JSON.stringify(JSON.parse(buff.toString()));

    var outName = path.join(__dirname, "data", nodeFileName);
    fs.writeFileSync(outName, content, "utf8");
    console.log("savedTo " + outName);
  }
}
