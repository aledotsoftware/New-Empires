const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`http://localhost:8080/index.html`);

  // Wait for the start button and click it
  await page.waitForSelector('#startButton');
  await page.click('#startButton');

  // Wait for map size selection
  await page.waitForSelector('.map-size-option');
  const mapSizes = await page.$$('.map-size-option');
  await mapSizes[0].click(); // Select small map for faster test

  // Wait for civ selection
  await page.waitForSelector('.civ-card');
  const civs = await page.$$('.civ-card');
  await civs[0].click(); // Select first civ

  // Wait for game to initialize
  await page.waitForTimeout(2000);

  // Pause the game loop to avoid timeout during screenshot
  await page.evaluate(() => {
    if (window.game) {
        window.game.isPaused = true;
    }
  });

  // Get canvas image data directly to avoid animation frame issues
  const dataUrl = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    return canvas.toDataURL();
  });

  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  require('fs').writeFileSync('/home/jules/verification/game_running.png', buffer);

  console.log('Screenshot taken!');
  await browser.close();
})();
