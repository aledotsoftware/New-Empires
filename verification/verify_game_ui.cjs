const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  await page.waitForSelector('#startButton');
  await page.click('#startButton');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/screenshot.png' });
  await browser.close();
})();
