import fs from 'fs';
import { chromium } from 'playwright';


(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set larger timeout
    page.setDefaultTimeout(60000);

    await page.goto('http://localhost:3000');

    console.log("Clicking Comenzar Juego");
    await page.click('#startButton');
    await page.waitForTimeout(1000);

    console.log("Clicking Pequeño map size");
    await page.click('#mapSizeGrid > div:first-child');
    await page.waitForTimeout(1000);

    console.log("Clicking Mongols civ");
    await page.evaluate(() => document.querySelector('#civGrid > div:first-child').click());

    console.log("Waiting for canvas to be visible");
    await page.waitForSelector('#gameCanvas', { state: 'visible' });

    // Give time to actually generate and render
    console.log("Waiting 5 seconds for render...");
    await page.waitForTimeout(5000);

    // Evaluate taking the canvas directly
    console.log("Grabbing canvas output directly");
    const dataUrl = await page.evaluate(() => {
        const canvas = document.getElementById('gameCanvas');
        return canvas.toDataURL('image/png');
    });

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync('/app/verification/decorations_map.png', base64Data, 'base64');

    console.log("Done");
    await browser.close();
})();
