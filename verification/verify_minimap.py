
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        try:
            # Click start button to show map size screen
            page.click("#startButton")

            # Click first map size option
            page.wait_for_selector(".map-size-option")
            page.click(".map-size-option >> nth=0")

            # Click first civ option (random or specific)
            page.wait_for_selector(".civ-option")
            page.click(".civ-option >> nth=0")

            # Wait for game to load (canvas)
            page.wait_for_selector("#gameCanvas", timeout=10000)

            time.sleep(2)

            # Check if game global exists
            is_running = page.evaluate("!!window.game")
            print(f"Game initialized: {is_running}")

            # Try screenshot with short timeout
            page.screenshot(path="verification/full_verify.png", timeout=5000)
            print("Screenshot taken.")

        except Exception as e:
            print(f"Verification failed: {e}")

        browser.close()

if __name__ == "__main__":
    run()
