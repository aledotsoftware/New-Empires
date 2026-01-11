
from playwright.sync_api import sync_playwright

def verify_exit_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game (served by python http.server)
        page.goto("http://localhost:8080/index.html")

        # Wait for game initialization
        page.wait_for_selector("#startButton")

        # Start game flow
        print("Starting game...")
        page.click("#startButton")

        # Wait for Map Size screen and select first option
        page.wait_for_selector(".map-size-option", state="visible")
        page.click(".map-size-option >> nth=0")

        # Wait for Civ Selection and select first option
        page.wait_for_selector(".civ-option", state="visible")
        page.click(".civ-option >> nth=0")

        # Wait for Game HUD to confirm we are in-game
        page.wait_for_selector("#gameHUD", state="visible")
        print("In game.")

        # Open Settings
        print("Opening settings...")
        page.click("#settingsButton")

        # Wait for Settings Modal
        page.wait_for_selector("#settingsScreen", state="visible")

        # Verify "Abandonar" button exists and is visible
        quit_btn = page.locator("#quitGameBtn")

        # Take screenshot of settings modal with quit button
        page.screenshot(path=".jules/verification/settings_with_quit.png")

        if quit_btn.is_visible():
            print("SUCCESS: Quit button is visible in game.")
        else:
            print("FAILURE: Quit button is NOT visible in game.")

        # Click Quit Button to trigger confirm
        # Note: Playwright handles dialogs automatically by dismissing, we need to accept
        page.on("dialog", lambda dialog: dialog.accept())
        quit_btn.click()

        # Verify we are back at start screen
        page.wait_for_selector("#startScreen", state="visible")
        if page.is_visible("#startScreen"):
            print("SUCCESS: Returned to Start Screen.")
        else:
             print("FAILURE: Did not return to Start Screen.")

        browser.close()

if __name__ == "__main__":
    verify_exit_button()
