const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`http://localhost:8080/index.html`);

  await page.waitForSelector('#startButton');
  await page.click('#startButton');

  await page.waitForSelector('.map-size-option');
  const mapSizes = await page.$$('.map-size-option');
  await mapSizes[0].click();

  await page.waitForSelector('.civ-option');
  const civs = await page.$$('.civ-option');
  await page.evaluate((el) => el.click(), civs[0]);

  await page.waitForTimeout(2000);

  // Take full page screenshot to see HUD
  await page.screenshot({ path: '/app/verification/hud_view.png', fullPage: true });

  console.log('Screenshot taken!');
  await browser.close();
})();
