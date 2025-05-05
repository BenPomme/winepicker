const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));

(async () => {
  const stagingUrl = argv.staging;
  const productionUrl = argv.production;
  if (!stagingUrl || !productionUrl) {
    console.error('Usage: node compare.js --staging=<url> --production=<url>');
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../compare-output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // capture staging
  await page.goto(stagingUrl, { waitUntil: 'networkidle0' });
  const stagingPath = path.join(outDir, 'staging.png');
  await page.screenshot({ path: stagingPath, fullPage: true });
  console.log(`Saved staging screenshot to ${stagingPath}`);

  // capture production
  await page.goto(productionUrl, { waitUntil: 'networkidle0' });
  const productionPath = path.join(outDir, 'production.png');
  await page.screenshot({ path: productionPath, fullPage: true });
  console.log(`Saved production screenshot to ${productionPath}`);

  await browser.close();

  // read images
  const imgStaging = PNG.sync.read(fs.readFileSync(stagingPath));
  const imgProd = PNG.sync.read(fs.readFileSync(productionPath));
  const { width, height } = imgStaging;
  const diff = new PNG({ width, height });

  const numDiff = pixelmatch(
    imgStaging.data,
    imgProd.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const diffPath = path.join(outDir, 'diff.png');
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  console.log(`Diff image saved to ${diffPath}`);
  console.log(`Number of differing pixels: ${numDiff}`);

  if (numDiff > 0) {
    console.error('Visual differences detected between staging and production.');
    process.exit(1);
  } else {
    console.log('No visual differences detected.');
    process.exit(0);
  }
})(); 