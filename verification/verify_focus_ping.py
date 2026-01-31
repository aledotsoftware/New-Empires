from playwright.sync_api import sync_playwright
import time
import os

def verify_focus_ping(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

    print("Navigating to game...")
    page.goto("http://localhost:3000")

    # 1. Start Game
    print("Clicking Start Game...")
    page.locator("#startButton").click()

    # 2. Select Map Size
    print("Selecting Map Size...")
    page.wait_for_selector(".map-size-option")

    tiny_map = page.locator(".map-size-option[data-size='tiny']")
    if tiny_map.count() > 0:
        tiny_map.click()
    else:
        page.locator(".map-size-option").first.click()

    # 3. Select Civilization
    print("Selecting Civilization...")
    page.wait_for_selector(".civ-option")
    page.locator(".civ-option").first.click()

    # 4. Wait for Game Screen
    print("Waiting for game screen...")
    try:
        page.wait_for_selector("#gameCanvas", state="visible", timeout=30000)
    except Exception as e:
        print("Timed out waiting for gameCanvas.")
        # Debug info
        game_screen = page.locator("#gameScreen")
        classes = game_screen.get_attribute("class")
        print(f"DEBUG: #gameScreen classes: {classes}")

        # Dump content
        with open("verification/debug_page_content.html", "w") as f:
            f.write(page.content())

        page.screenshot(path="verification/timeout_state.png")
        raise e

    # Wait for full initialization
    time.sleep(3)

    print("Game started. Triggering focus ping via minimap click...")

    # Locate minimap canvas
    minimap = page.locator("#minimapCanvas")
    box = minimap.bounding_box()

    if box:
        print(f"Clicking minimap at {box['x'] + box['width']/2}, {box['y'] + box['height']/2}")
        page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)

        time.sleep(0.1)

        os.makedirs("verification", exist_ok=True)
        print("Taking screenshot...")
        page.screenshot(path="verification/focus_ping_result.png")
        print("Screenshot saved to verification/focus_ping_result.png")
    else:
        print("Error: Minimap bounding box not found")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        try:
            verify_focus_ping(page)
        except Exception as e:
            print(f"Test Execution Failed: {e}")
            try:
                page.screenshot(path="verification/error_state.png")
            except:
                pass
        finally:
            browser.close()
