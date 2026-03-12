from playwright.sync_api import sync_playwright
import time
import base64

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})

    page.goto('http://localhost:3000')

    print("Clicking Comenzar Juego")
    page.click('#startButton')
    time.sleep(1)

    print("Clicking Pequeño map size")
    page.click('#mapSizeGrid > div:first-child')
    time.sleep(1)

    print("Clicking Mongols civ")
    page.click('#civGrid > div:first-child')

    print("Waiting for game load...")
    time.sleep(10)

    print("Executing JS to get canvas data")
    data_url = page.evaluate('''
        () => {
            const canvas = document.getElementById("gameCanvas");
            return canvas ? canvas.toDataURL("image/png") : null;
        }
    ''')

    if data_url:
        print("Saving image")
        encoded_data = data_url.split(",")[1]
        decoded_data = base64.b64decode(encoded_data)
        with open("/home/jules/verification/decorations_map.png", "wb") as f:
            f.write(decoded_data)
    else:
        print("Could not get canvas data")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
