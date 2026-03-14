const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log(`[Browser Console]: ${msg.type()} - ${msg.text()}`));
    page.on('pageerror', error => console.error(`[Browser Error]: ${error.message}`));

    await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });

    // Start game
    try {
        await page.waitForSelector('#startButton', { timeout: 5000 });
        await page.click('#startButton');

        await page.waitForSelector('.map-size-option', { timeout: 5000 });
        const mapOptions = await page.$$('.map-size-option');
        if (mapOptions.length > 0) await mapOptions[0].click();

        await page.waitForSelector('.civ-option', { timeout: 5000 });
        const civOptions = await page.$$('.civ-option');
        if (civOptions.length > 0) await civOptions[0].click();

        console.log("Clicked through menu, waiting for game render...");
        await page.waitForTimeout(5000); // let it render

        await page.screenshot({ path: 'debug_screenshot.png' });
        console.log("Screenshot taken.");
    } catch (e) {
        console.error("Error clicking through menus:", e);
    }

    await browser.close();
})();
