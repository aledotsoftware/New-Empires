const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:8080');

  // Wait for the game to load
  await page.waitForTimeout(5000);

  // Check that the data loader loaded all civs
  const dataLoaderHasCivs = await page.evaluate(() => {
    return window.dataLoader && Object.keys(window.dataLoader.civilizations).length > 0;
  });

  console.log(`Data loader has civs: ${dataLoaderHasCivs}`);

  await browser.close();
})();
