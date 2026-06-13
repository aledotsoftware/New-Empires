import fs from 'fs';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto(`http://localhost:3000/index.html`);

  // Wait for the start button and click it
  await page.waitForSelector('#startButton');
  await page.click('#startButton');

  // Wait for map size selection
  await page.waitForSelector('.map-size-option');
  const mapSizes = await page.$$('.map-size-option');
  await mapSizes[0].click(); // Select small map for faster test

  // Wait for civ selection
  await page.waitForSelector('.civ-option');
  const civs = await page.$$('.civ-option');
  await page.evaluate((el) => el.click(), civs[0]); // Select first civ

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
  fs.writeFileSync('/app/verification/game_running.png', buffer);

  console.log('Screenshot taken!');
  await browser.close();
})();
