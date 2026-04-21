from playwright.sync_api import Page, expect, sync_playwright
import time

def test_fow_render(page: Page):
    # 1. Arrange: Go to the game
    page.goto("http://localhost:3000")

    # 2. Act: Start Game
    page.click("#startButton")

    # Wait for Map Size screen
    page.wait_for_selector("#mapSizeScreen:not(.hidden)", timeout=10000)
    time.sleep(1)
    # Select 'Small' (should be quick to render)
    page.click(".map-size-option[data-size='small']")

    # Wait for Civ Selection
    page.wait_for_selector("#civSelectionScreen:not(.hidden)", timeout=10000)
    time.sleep(1)
    # Select first civ (e.g. random or first available)
    page.click(".civ-option")

    # Wait for Game Screen
    page.wait_for_selector("#gameScreen:not(.hidden)", timeout=10000)
    page.wait_for_selector("#gameCanvas", timeout=10000)

    # 3. Assert: Verify game is running
    # Check if canvas exists
    expect(page.locator("#gameCanvas")).to_be_visible()

    # Wait a bit for rendering loop to run and FOW to update
    time.sleep(2)

    # 4. Screenshot
    page.screenshot(path="verification/fow_verification.png")
    print("Screenshot saved to verification/fow_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_fow_render(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
