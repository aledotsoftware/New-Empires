import os
import time
from playwright.sync_api import sync_playwright, expect

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start Game
        print("Navigating to game...")
        page.goto("http://localhost:8000")

        # Click Start
        print("Clicking Start...")
        page.click("#startButton")

        # Wait for Map Size screen
        print("Selecting Map Size...")
        page.wait_for_selector("#mapSizeGrid", state="visible")
        page.click(".map-size-option")

        # Wait for Civ Selection
        print("Selecting Civilization...")
        page.wait_for_selector("#civGrid", state="visible")
        page.click(".civ-option")

        # Wait for Game Canvas
        print("Waiting for game to load...")
        page.wait_for_selector("#gameCanvas", state="visible")

        # Wait a bit for initialization
        time.sleep(2)

        # Ensure focus on canvas
        page.click("#gameCanvas")

        # Select Idle Villager (Required to open build menu)
        print("Selecting Idle Villager...")
        page.keyboard.press("Tab")
        time.sleep(0.5)

        # 2. Open Build Menu
        print("Opening Build Menu...")
        page.keyboard.press("b")
        # Wait for menu to appear
        page.wait_for_selector("#buildMenu", state="visible")

        # 3. Verify Town Center Count (Should be 1)
        print("Verifying Town Center Count...")
        # Find the build option for Town Center
        tc_option = page.locator('.build-option[data-building="townCenter"]')
        expect(tc_option).to_be_visible()

        # Check Badge
        tc_badge = tc_option.locator('.owned-badge')
        expect(tc_badge).to_be_visible()
        expect(tc_badge).to_have_text("1")
        print("✅ Town Center count is 1")

        # 4. Verify House Count (Should be 0/Hidden)
        print("Verifying House Count (Initial)...")
        house_option = page.locator('.build-option[data-building="house"]')
        expect(house_option).to_be_visible()

        house_badge = house_option.locator('.owned-badge')
        # Expect to be hidden or text empty? My logic sets display: none if 0
        expect(house_badge).not_to_be_visible()
        print("✅ House count is 0 (hidden)")

        # Close menu to build
        # Note: Pressing Escape here closes menu AND deselects unit due to Game.js logic
        page.keyboard.press("Escape")
        time.sleep(0.5)

        # 5. Build a House
        # Re-select idle villager
        print("Re-selecting Idle Villager...")
        page.keyboard.press("Tab")
        time.sleep(0.5)

        # Open Build Menu again
        print("Opening Build Menu for construction...")
        page.keyboard.press("b")
        page.wait_for_selector("#buildMenu", state="visible")

        # Select House (Q)
        print("Selecting House to build...")
        page.keyboard.press("q")

        # Now in placement mode. Click somewhere valid.
        print("Placing House...")
        page.mouse.click(500, 500)
        time.sleep(1) # Wait for construction to start

        # 6. Verify House Count Increment
        # Re-select idle villager (placement might have deselected or not, safer to reselect)
        print("Re-selecting Idle Villager (Post-Build)...")
        page.keyboard.press("Tab")
        time.sleep(0.5)

        # Open Build Menu again
        print("Checking House Count after build start...")
        page.keyboard.press("b")
        page.wait_for_selector("#buildMenu", state="visible")

        house_badge = house_option.locator('.owned-badge')
        expect(house_badge).to_be_visible()
        expect(house_badge).to_have_text("1")
        print("✅ House count is 1")

        # 7. Screenshot
        print("Taking screenshot...")
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/ux_build_count.png")

        browser.close()

if __name__ == "__main__":
    run_test()
