from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start Game
        print("Navigating to game...")
        page.goto("http://localhost:3000")

        # Wait for start screen
        page.wait_for_selector("#startScreen")
        print("Start screen loaded.")

        # Click Start
        page.click("#startButton")
        print("Clicked Start.")

        # Wait for Map Selection
        page.wait_for_selector("#mapSizeScreen:not(.hidden)")
        print("Map Selection loaded.")

        # Select first map size
        page.click(".map-size-option")
        print("Map selected.")

        # Wait for Civ Selection
        page.wait_for_selector("#civSelectionScreen:not(.hidden)")
        print("Civ Selection loaded.")

        # Select first civ
        page.click(".civ-option")
        print("Civ selected.")

        # Wait for Game Screen
        page.wait_for_selector("#gameScreen:not(.hidden)")
        print("Game started.")

        # Wait a bit for game init
        time.sleep(2)

        # 2. Open Settings
        print("Opening settings...")
        page.click("#settingsButton")

        # Wait for Settings Modal
        page.wait_for_selector("#settingsScreen:not(.hidden)")
        print("Settings opened.")

        # 3. Verify Restart Button
        restart_btn = page.query_selector("#restartGameBtn")
        if restart_btn:
            print("Restart button found.")
            is_hidden = "hidden" in restart_btn.get_attribute("class")
            if not is_hidden:
                print("Restart button is visible.")
            else:
                print("ERROR: Restart button is hidden.")
        else:
            print("ERROR: Restart button not found.")

        # 4. Take Screenshot
        page.screenshot(path="verification/restart_button_check.png")
        print("Screenshot saved to verification/restart_button_check.png")

        browser.close()

if __name__ == "__main__":
    run()
