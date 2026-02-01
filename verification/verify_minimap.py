from playwright.sync_api import sync_playwright
import time

def verify_minimap():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        print("Navigating to game...")
        page.goto("http://localhost:3000")

        # Act: Start Game
        print("Clicking Start Button...")
        page.wait_for_selector("#startButton", state="visible")
        page.click("#startButton")

        # Handle Map Size
        print("Waiting for Map Size screen...")
        page.wait_for_selector(".map-size-option", state="visible", timeout=5000)
        print("Map Size screen detected. Selecting first option.")
        page.click(".map-size-option >> nth=0")

        # Handle Civ Selection
        print("Waiting for Civ Selection screen...")
        page.wait_for_selector(".civ-option", state="visible", timeout=5000)
        print("Civ Selection screen detected. Selecting first civ.")
        page.click(".civ-option >> nth=0")

        # Now wait for game screen
        print("Waiting for game screen...")
        page.wait_for_selector("#gameScreen", state="visible", timeout=10000)

        # Wait for initialization
        time.sleep(3)

        # Screenshot: Capture the minimap
        minimap = page.locator("#minimapCanvas")

        minimap.screenshot(path="verification/minimap_after.png")
        print("Screenshot saved to verification/minimap_after.png")

        browser.close()

if __name__ == "__main__":
    verify_minimap()
