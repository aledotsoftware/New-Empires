const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // catch console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:8080');

  // Wait for the game to load
  await page.waitForTimeout(5000);

  await browser.close();
})();
