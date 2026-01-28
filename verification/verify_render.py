from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # 1. Click Start Game
        print("Clicking Start Game...")
        page.click("#startButton")

        # 2. Map Size Selection
        print("Waiting for Map Size options...")
        page.wait_for_selector(".map-size-option")
        # Click the first one
        page.click(".map-size-option >> nth=0")

        # 3. Civilization Selection
        print("Waiting for Civ options...")
        page.wait_for_selector(".civ-option")
        # Click the first one
        page.click(".civ-option >> nth=0")

        # 4. Wait for Game Canvas
        print("Waiting for game canvas...")
        page.wait_for_selector("#gameCanvas", state="visible")

        # Wait a bit for render loop to run
        time.sleep(2)

        # Take screenshot
        page.screenshot(path="verification/game_render.png")
        print("Screenshot taken.")
        browser.close()

if __name__ == "__main__":
    run()
