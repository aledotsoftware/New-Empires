from playwright.sync_api import sync_playwright, expect
import time

def test_minimap_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to game
        page.goto("http://localhost:3000")

        # Click Start Game
        page.get_by_role("button", name="Comenzar Juego").click()

        # Wait for Map Size screen
        expect(page.locator("#mapSizeScreen")).not_to_have_class("hidden")

        # Select Normal map
        # Note: map size options are div[role="button"]
        page.locator(".map-size-option").filter(has_text="Normal").click()

        # Wait for Civ screen
        expect(page.locator("#civSelectionScreen")).not_to_have_class("hidden")

        # Select first Civ (div.civ-option)
        page.locator(".civ-option").first.click()

        # Wait for Game Screen
        expect(page.locator("#gameScreen")).not_to_have_class("hidden")

        # Wait for game initialization
        time.sleep(2)

        # Check Minimap visibility
        minimap = page.locator("#minimapCanvas")
        expect(minimap).to_be_visible()

        # Take screenshot of minimap
        # We can take element screenshot
        minimap.screenshot(path="/home/jules/verification/minimap_screenshot.png")

        # Take full screenshot for context
        page.screenshot(path="/home/jules/verification/full_screenshot.png")

        print("Screenshots taken.")
        browser.close()

if __name__ == "__main__":
    test_minimap_render()
