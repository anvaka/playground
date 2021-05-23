#/bin/bash
cat node_modules/ngraph.forcelayout/dist/ngraph.forcelayout2d.js > run.js && 
browserify -s run index.js >> run.js
