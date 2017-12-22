var puppeteer = require('puppeteer');
var browser, page;
var viewPort = {
  width: 1024,
  height: 768
}
puppeteer.launch({args: ['--headless']})
  .then(saveBrowser)
  .then(runPageScript);

function saveBrowser(b) {
  browser = b;
  return browser.newPage()
}

function runPageScript(p) {
  page = p;
  page.setViewport(viewPort).then(navigateToPage);
}

function navigateToPage(){
  page.goto('https://anvaka.github.io/fieldplay?ui=0').then(() => {
    // Let fieldplay play for a while
    setTimeout(takeScreenShotAndClose, 20000);
  })
}

function takeScreenShotAndClose() {
  page.screenshot({path: 'example.png'}).then(() => browser.close());
}
