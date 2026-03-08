const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/sim_game.html');
  // wait for it to run
  await page.waitForTimeout(2000);
  const title = await page.title();
  console.log("Page title:", title);
  await browser.close();
})();
