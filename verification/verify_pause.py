from playwright.sync_api import sync_playwright
import time
import sys

def verify_pause():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start Application
        print("Navigating to app...")
        try:
            page.goto("http://localhost:3000")
        except Exception as e:
            print(f"Error connecting to server: {e}")
            sys.exit(1)

        # 2. Start Game Flow
        print("Starting game...")
        page.click("#startButton")
        page.wait_for_selector(".map-size-option")
        page.click(".map-size-option")
        page.wait_for_selector(".civ-option")
        page.click(".civ-option")
        page.wait_for_selector("#gameCanvas")

        # Allow game to initialize
        time.sleep(1)

        # 3. Verify Initial State (Not Paused)
        print("Checking initial state...")
        overlay = page.locator("#pauseOverlay")
        if not overlay.is_hidden():
            print("FAILURE: Pause overlay should be hidden initially")
            sys.exit(1)

        # 4. Trigger Pause via Keyboard
        print("Pressing 'P' to pause...")
        page.keyboard.press("p")
        time.sleep(0.5)

        # 5. Verify Paused State
        print("Checking paused state...")
        if overlay.is_hidden():
            print("FAILURE: Pause overlay should be visible after pressing 'P'")
            sys.exit(1)

        # Check text
        title = page.locator("#pauseTitle")
        if "PAUSA" not in title.inner_text():
            print(f"FAILURE: Unexpected title text: {title.inner_text()}")
            sys.exit(1)

        # Check button
        resume_btn = page.locator("#resumeButton")
        if not resume_btn.is_visible():
            print("FAILURE: Resume button not visible")
            sys.exit(1)

        # Screenshot
        print("Taking screenshot of Pause Overlay...")
        page.screenshot(path="verification/pause_overlay.png")

        # 6. Resume via Button
        print("Clicking Resume button...")
        resume_btn.click()
        time.sleep(0.5)

        # 7. Verify Resumed State
        print("Checking resumed state...")
        if not overlay.is_hidden():
            print("FAILURE: Pause overlay should be hidden after resuming")
            sys.exit(1)

        print("SUCCESS: Pause overlay functionality verified!")
        browser.close()

if __name__ == "__main__":
    verify_pause()
