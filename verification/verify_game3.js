const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // catch console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Navigate and listen to requests
  page.on('response', response => {
    if (response.status() === 404) {
      console.log('404 Not Found:', response.url());
    }
  });

  await page.goto('http://localhost:8080');

  // Wait for the game to load
  await page.waitForTimeout(5000);

  await browser.close();
})();
