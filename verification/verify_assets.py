
from playwright.sync_api import Page, expect, sync_playwright
import os

def test_assets_loaded(page: Page):
    # Navigate to the game
    page.goto("http://localhost:3000")

    # Click start button
    page.locator("#startButton").click()

    # Wait for map size selection (transition)
    page.wait_for_selector("#mapSizeScreen", state="visible")
    page.wait_for_timeout(500)

    # Click map size
    page.locator(".map-size-option").first.click()

    # Wait for Civ selection
    page.wait_for_selector("#civSelectionScreen", state="visible")
    page.wait_for_timeout(500)

    # Click first civ
    page.locator(".civ-option").first.click()

    # Wait for game screen to be visible
    page.wait_for_selector("#gameScreen", state="visible")

    # Wait for game to initialize (canvas visible)
    page.wait_for_selector("#gameCanvas", state="visible")

    # Check for resource icons in the UI (top bar)
    # The structure is .resource-item > img
    # We expect these images to have src attributes

    # Wait for UI to be populated
    page.wait_for_timeout(1000)

    # Take screenshot of the UI
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/game_ui.png")

    images = page.locator(".top-panel img").all()
    print(f"Found {len(images)} icons in top panel")

    for img in images:
        src = img.get_attribute("src")
        print(f"Image src: {src}")
        if not src or src == "":
             raise Exception("Image src is empty!")

    # Verify specific icon is correct
    wood_icon = page.locator("#woodCount").locator("..").locator("..").locator("img").first
    src = wood_icon.get_attribute("src")
    if "wood" not in src.lower() and "storage" not in src.lower():
        print(f"Warning: Wood icon src is {src}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_assets_loaded(page)
        except Exception as e:
            print(f"Test failed: {e}")
            exit(1)
        finally:
            browser.close()
