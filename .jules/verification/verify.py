from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open via HTTP server to avoid CORS/file protocol issues with modules
        page.goto("http://localhost:8080/index.html")

        # Wait for content
        page.wait_for_selector(".controls-info")

        # Verify Key Styles
        # Check if control-key elements exist and take a screenshot of them
        controls = page.locator(".controls-info")
        if controls.is_visible():
            controls.screenshot(path=".jules/verification/keys.png")
            print("Keys screenshot taken.")

        # Verify Game Over Dialog Accessibility
        # We need to manually trigger it visible since it is hidden
        page.evaluate("document.getElementById('gameOverScreen').classList.remove('hidden')")

        game_over = page.locator("#gameOverScreen")
        if game_over.is_visible():
            role = game_over.get_attribute("role")
            aria_modal = game_over.get_attribute("aria-modal")

            print(f"Game Over Role: {role}")
            print(f"Game Over Aria-Modal: {aria_modal}")

            game_over.screenshot(path=".jules/verification/game_over.png")
            print("Game Over screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_changes()
