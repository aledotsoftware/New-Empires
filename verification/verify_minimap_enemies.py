from playwright.sync_api import sync_playwright, expect
import time
import os

def verify_minimap_enemies(page):
    print("Navigating to game...")
    page.goto("http://localhost:3000")

    # 1. Start Game
    print("Clicking Start Game...")
    page.locator("#startButton").click()

    # 2. Select Map Size (Normal)
    print("Selecting Map Size...")
    page.locator(".map-size-option[data-size='normal']").click()

    # 3. Select Civilization (First one)
    print("Selecting Civilization...")
    page.wait_for_selector(".civ-option")
    page.locator(".civ-option").first.click()

    # 4. Wait for Game to Load
    print("Waiting for game to load...")
    # Wait for canvas instead of container
    page.wait_for_selector("#gameCanvas", state="visible", timeout=10000)

    # Wait a bit for enemies to spawn and rendering to stabilize
    time.sleep(3)

    # 5. Capture Minimap Screenshot
    print("Capturing minimap screenshot...")

    # Ensure verification dir exists
    os.makedirs("verification", exist_ok=True)

    # Take screenshot of the whole page
    page.screenshot(path="verification/minimap_check_full.png")

    # Locate minimap canvas
    minimap = page.locator("#minimapCanvas")

    # Take screenshot of just the minimap
    minimap.screenshot(path="verification/minimap_only.png")

    print("Screenshots saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to standard size
        page.set_viewport_size({"width": 1280, "height": 720})

        try:
            verify_minimap_enemies(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
