from playwright.sync_api import sync_playwright
import time

def verify_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start Application
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # 2. Click Start Button
        print("Clicking Start Game...")
        page.click("#startButton")

        # 3. Select Map Size
        print("Selecting Map Size...")
        # Wait for map size options to populate
        page.wait_for_selector(".map-size-option")
        # Click the 'normal' map size or just the first one
        page.click(".map-size-option")

        # 4. Select Civilization
        print("Selecting Civilization...")
        # Wait for civ options to populate
        page.wait_for_selector(".civ-option")
        # Click the first civ option
        page.click(".civ-option")

        # 5. Wait for Game to Load
        print("Waiting for game canvas...")
        page.wait_for_selector("#gameCanvas")

        # Wait a bit for rendering loop to run a few frames
        time.sleep(2)

        # 6. Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/render_verify.png")
        print("Screenshot saved to verification/render_verify.png")

        browser.close()

if __name__ == "__main__":
    verify_render()
