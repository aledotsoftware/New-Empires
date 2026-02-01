from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/index.html")

        # Fast forward
        page.locator("#startButton").click()
        page.locator(".map-size-option").first.click()
        page.locator(".civ-option").first.click()

        # Wait until game screen is visible (using a loop to avoid timeout crash)
        for i in range(30):
            if page.locator("#gameScreen").is_visible():
                break
            time.sleep(1)

        # Open shortcuts
        page.keyboard.press("?")
        time.sleep(1)

        # Verify
        if page.locator("#shortcutsScreen").is_visible():
            print("SUCCESS: Shortcuts modal visible")
            try:
                page.screenshot(path="verification/verification.png")
            except:
                print("Screenshot timed out, but verified logic.")
        else:
            print("FAILURE: Modal not visible")

        browser.close()

if __name__ == "__main__":
    run()
