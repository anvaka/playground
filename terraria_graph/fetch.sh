wget -O recepies.json https://terraria.fandom.com/wiki/Special:CargoExport?tables=Recipes&&fields=_pageName%3DPage%2Cresult%3Dresult%2Cresultid%3Dresultid%2Cresultimage%3Dresultimage%2Cresulttext%3Dresulttext%2Camount%3Damount%2Cversion%3Dversion%2Cstation%3Dstation%2Cingredients__full%3Dingredients%2Cings%3Dings%2Cargs%3Dargs&&order+by=&limit=5000&format=json
node tograph.js recepies.json graphs/output.dot
sfdp -Goverlap=prism graphs/output.dot | gvmap -e | neato -Ecolor="#55555522" -n2 -Tsvg > 1.svg
