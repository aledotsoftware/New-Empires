import fs from 'fs';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Increase timeout to wait for game load and map generation
  await page.goto('http://localhost:3000', { timeout: 60000 });

  // Wait a bit more for map generation to fully finish
  await page.waitForTimeout(5000);

  // Evaluate code in browser to run the benchmark test and print results to console
  await page.evaluate(() => {
    console.log('Testing map generation and visual look...');
    if (window.game && window.game.terrainMap) {
      console.log('TerrainMap is generated');
    }
  });

  await page.screenshot({ path: '/app/verification/verification.png' });

  await browser.close();
})();