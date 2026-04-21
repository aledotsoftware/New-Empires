from playwright.sync_api import Page, expect, sync_playwright
import time

def test_fow_render(page: Page):
    page.goto("http://localhost:3000")

    # 2. Start
    page.wait_for_selector("#startButton", timeout=5000)
    page.click("#startButton")

    # Give some time to load map
    time.sleep(2)

    # Check if we bypassed menu to canvas
    if page.locator("#gameCanvas").is_visible():
        # Enabled FOW via Config injection
        page.evaluate("if(typeof CONFIG !== 'undefined') CONFIG.VISION.ENABLED = true;")
        time.sleep(2)
        page.screenshot(path="verification/fow_verification.png")
        print("Screenshot saved to verification/fow_verification.png")
        return

    page.wait_for_selector(".map-size-option", timeout=5000)
    page.locator(".map-size-option").nth(0).click()

    time.sleep(1)

    page.wait_for_selector(".civ-option", timeout=5000)
    page.locator(".civ-option").nth(0).click()

    # 3. Wait for canvas
    expect(page.locator("#gameCanvas")).to_be_visible(timeout=5000)

    # Enable FOW via Config injection
    page.evaluate("if(typeof CONFIG !== 'undefined') CONFIG.VISION.ENABLED = true;")
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
