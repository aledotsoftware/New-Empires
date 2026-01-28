
from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # 1. Click Start
            print("Clicking Start Button...")
            page.click("#startButton")

            # 2. Wait for Map Size Screen and Select
            print("Waiting for Map Size Screen...")
            page.wait_for_selector("#mapSizeScreen", state="visible")
            page.wait_for_selector(".map-size-option")
            print("Selecting Map Size...")
            page.locator(".map-size-option").first.click()

            # 3. Wait for Civ Selection Screen and Select
            print("Waiting for Civ Selection Screen...")
            page.wait_for_selector("#civSelectionScreen", state="visible")
            page.wait_for_selector(".civ-option")
            print("Selecting Civilization...")
            page.locator(".civ-option").first.click()

            # 4. Wait for Game Screen
            print("Waiting for Game Screen...")
            page.wait_for_selector("#gameScreen", state="visible")
            page.wait_for_selector("#gameCanvas", state="visible")

            time.sleep(1)

            # Move camera to find resources (Press Right Arrow)
            print("Moving camera...")
            page.keyboard.press("ArrowRight", delay=2000) # Hold for 2s? No, press is down+up.
            # To hold, use down then up.
            page.keyboard.down("ArrowRight")
            time.sleep(2)
            page.keyboard.up("ArrowRight")

            time.sleep(1)

            # Take screenshot (relative path)
            screenshot_path = "verification/render_check_moved.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
            print(f"Absolute path: {os.path.abspath(screenshot_path)}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
