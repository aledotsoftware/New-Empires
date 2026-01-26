
from playwright.sync_api import Page, expect, sync_playwright
import os
import time

def test_assets_loaded(page: Page):
    # Navigate to the game
    page.goto("http://localhost:3000")

    # Click start button
    page.locator("#startButton").click()

    # Wait for map size selection (transition)
    page.wait_for_selector("#mapSizeScreen", state="visible")
    page.wait_for_timeout(500)

    # Click map size
    page.locator(".map-size-option").first.click()

    # Wait for Civ selection
    page.wait_for_selector("#civSelectionScreen", state="visible")
    page.wait_for_timeout(500)

    # Click first civ
    page.locator(".civ-option").first.click()

    # Wait for game screen to be visible
    page.wait_for_selector("#gameScreen", state="visible")

    # Wait for game to initialize (canvas visible)
    page.wait_for_selector("#gameCanvas", state="visible")

    # Wait for UI to be populated
    page.wait_for_timeout(2000)

    # Get canvas size
    bbox = page.locator("#gameCanvas").bounding_box()
    center_x = bbox["width"] / 2
    center_y = bbox["height"] / 2

    # Click center to select Town Center (it spawns at center)
    page.mouse.click(bbox["x"] + center_x, bbox["y"] + center_y)

    # Wait for selection panel to update
    page.wait_for_timeout(500)

    # Check selection content
    # Should contain "Centro Urbano" or "Town Center"
    content = page.locator("#selectionContent").inner_text()
    print(f"Selection content: {content}")

    # Check for icon in selection panel
    # .selection-icon img
    sel_icon = page.locator(".selection-icon img").first
    if sel_icon.is_visible():
        src = sel_icon.get_attribute("src")
        print(f"Selection Icon Src: {src}")
        if not src:
            raise Exception("Selection icon src missing")
    else:
        print("Selection icon not visible (might be using fallback text?)")

    # Check Actions Panel (Command Panel)
    # Should have buttons for Villager training if TC selected
    buttons = page.locator("#commandPanel .action-btn").all()
    print(f"Command panel buttons: {len(buttons)}")

    found_action_icon = False
    for btn in buttons:
        # Check if button has icon
        img = btn.locator(".btn-icon img").first
        if img.is_visible():
            src = img.get_attribute("src")
            print(f"Action button icon: {src}")
            found_action_icon = True

    if not found_action_icon:
        print("No action icons found. Maybe selection failed or no actions available.")

    # Take screenshot of the UI
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/game_ui_dynamic.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_assets_loaded(page)
        except Exception as e:
            print(f"Test failed: {e}")
            exit(1)
        finally:
            browser.close()
