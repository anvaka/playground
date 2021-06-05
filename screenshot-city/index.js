/**
 * This script turns all *.pbf cities from https://github.com/anvaka/index-large-cities 
 * into screenshots.
 */
const puppeteer = require('puppeteer');
const dataFolder = 'data-small';
const fs = require('fs');
const path = require('path');
const width = 800;
const height = 800;

// Assuming https://github.com/anvaka/city-roads is running locally
const cityRoadsHost = 'http://localhost:8081/';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width, height, deviceScaleFactor: 2});

  const ids = [];
  fs.readdirSync(dataFolder).forEach(file => {
    if (file.endsWith('.pbf')) {
      ids.push(file.replace('.pbf', ''))
    }
  });

  let processed = 0, count = ids.length;
  for (const id of ids) {
    processed += 1;
    let imageName = `images/${id}.png`;
    if (fs.existsSync(imageName)) continue;
    let url = `${cityRoadsHost}?q=${id}&areaId=${id}&auto=true`;
    console.log('Loading ' + url);

    await page.goto(url);
    await page.waitForSelector('.controls', {
      timeout: 60000 * 4
    })
    await page.evaluate(() => {
      document.querySelector('.controls').style.display = 'none'
    })
    await page.screenshot({ path: imageName });
    console.log('processed ' + processed + ' out of ' + count)
  }

  await browser.close();
})();
