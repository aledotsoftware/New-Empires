from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the game
        page.goto('http://localhost:8000/index.html')

        # Check for module script load errors in console
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        # Wait blindly for a bit since wait_for_selector failed (maybe due to visibility or overlay)
        # But verify Game object exists in window
        try:
             page.wait_for_function('() => window.gameInstance !== undefined', timeout=5000)
             print("Game instance found")
        except:
             print("Game instance NOT found, checking for loading errors")
             page.screenshot(path='.jules/error_state.png')

        page.wait_for_timeout(2000)

        page.screenshot(path='.jules/ui_check.png')
        print("Screenshot taken")

        browser.close()

if __name__ == '__main__':
    run()
