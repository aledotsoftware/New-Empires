from playwright.sync_api import sync_playwright, expect
import time

def verify_accessibility(page):
    # 1. Arrange
    page.goto("http://localhost:3000")

    # 2. Act
    settings_btn = page.locator("#settingsButtonStart")
    settings_btn.click()

    # Debug: Check class
    time.sleep(1)
    screen = page.locator("#settingsScreen")
    print(f"Class: {screen.get_attribute('class')}")

    # Force wait for animation?
    time.sleep(1)

    # 3. Assert
    # Check attributes
    vol_val = page.locator("#volumeValue")
    expect(vol_val).to_have_attribute("aria-live", "polite")
    expect(vol_val).to_have_attribute("aria-atomic", "true")
    print("Verified volumeValue.")

    # Check canvas
    canvas = page.locator("#gameCanvas")
    expect(canvas).to_have_attribute("role", "application")
    print("Verified gameCanvas.")

    # 4. Screenshot
    page.screenshot(path="verification/accessibility_verification.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
