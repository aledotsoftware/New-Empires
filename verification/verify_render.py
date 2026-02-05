from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Log console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))

        page.goto("http://localhost:3000")

        # 1. Click Start Game
        page.wait_for_selector("#startButton")
        page.click("#startButton")
        print("Clicked Start")

        # 2. Select Map Size (Small)
        page.wait_for_selector(".map-size-option", state="visible")
        page.click(".map-size-option >> nth=0")
        print("Selected Map Size")

        # 3. Select Civilization (Romans)
        page.wait_for_selector(".civ-option", state="visible")
        page.click(".civ-option >> nth=0")
        print("Selected Civ")

        # 4. Wait for Game Screen
        try:
            page.wait_for_selector("#gameScreen:not(.hidden)", state="visible", timeout=5000)
            print("Game Screen Visible")
        except Exception as e:
            print(f"Wait failed: {e}")
            page.screenshot(path="verification/failed_state.png")

        # 5. Wait for canvas rendering
        time.sleep(2)

        # 6. Take Screenshot
        page.screenshot(path="verification/verification.png")
        print("Screenshot taken")

        browser.close()

if __name__ == "__main__":
    run()
