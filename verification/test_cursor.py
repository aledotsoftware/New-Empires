from playwright.sync_api import Page, expect, sync_playwright
import time

def test_cursor(page: Page):
    page.goto("http://localhost:8080/index.html")

    # Wait for the start screen
    page.wait_for_selector("#startButton")
    page.click("#startButton")

    page.wait_for_selector(".map-size-option")
    page.click(".map-size-option")

    # Wait for civilizaton option
    page.wait_for_selector(".civ-option")
    page.click(".civ-option")

    # Wait for the game canvas to render
    page.wait_for_selector("#gameCanvas")
    time.sleep(2) # Give it time to load map and UI

    # Move mouse around to trigger cursor rendering
    canvas = page.locator("#gameCanvas")
    box = canvas.bounding_box()

    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        time.sleep(0.5)
        page.mouse.move(box["x"] + box["width"] / 2 + 50, box["y"] + box["height"] / 2 + 50)
        time.sleep(0.5)

    page.screenshot(path="verification/cursor.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Extend viewport as suggested in AGENTS.md
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        try:
            test_cursor(page)
        finally:
            browser.close()
