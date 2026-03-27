from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000")
    page.wait_for_timeout(1000)

    # We click "Iniciar Juego"
    start_btn = page.locator("#startButton")
    if start_btn.is_visible():
        start_btn.click(force=True)
        page.wait_for_timeout(1000)

        # Select map size
        map_size = page.locator(".map-size-option").first
        if map_size.is_visible():
            map_size.click(force=True)
            page.wait_for_timeout(1000)

        # Select civilization
        civ = page.locator(".civ-option").nth(1)
        if civ.is_visible():
            civ.click(force=True)
            page.wait_for_timeout(2000)

    # Wait some time to let the game run and potentially crash if the bug was still there
    page.wait_for_timeout(5000)

    # Pause the game loop to avoid continuous rendering preventing screenshots
    page.evaluate("if (typeof game !== 'undefined' && game.isPaused !== undefined) { game.isPaused = true; }")
    page.wait_for_timeout(500)

    # Take screenshot at the key moment, bypassing font wait if needed
    try:
        page.screenshot(path="/home/jules/verification/screenshots/verification.png", timeout=5000)
    except Exception as e:
        print(f"Screenshot error: {e}")
        # Extract canvas data URL as fallback
        data_url = page.evaluate('''() => {
            const canvas = document.getElementById('gameCanvas');
            return canvas ? canvas.toDataURL() : null;
        }''')
        if data_url:
            import base64
            header, encoded = data_url.split(",", 1)
            data = base64.b64decode(encoded)
            with open("/home/jules/verification/screenshots/verification.png", "wb") as f:
                f.write(data)

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()
