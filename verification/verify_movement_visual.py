
import time
from playwright.sync_api import sync_playwright

def verify_movement():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Browser Error: {exc}"))

        # 1. Load the game
        page.goto("http://localhost:3000")

        # Wait for start button
        page.wait_for_selector("#startButton")
        print("Start button found")

        # Click start button
        page.click("#startButton")
        print("Clicked start button")

        # Wait for Map Size selection
        try:
            # Wait for map size options to be populated
            page.wait_for_selector(".map-size-option", timeout=10000)
            print("Map size options appeared")

            # Click first size
            page.click(".map-size-option")
            print("Selected map size")

            # Wait for Civ selection
            page.wait_for_selector(".civ-option", timeout=10000)
            print("Civ options appeared")

            # Click first civ
            page.click(".civ-option")
            print("Selected civ")

        except Exception as e:
            print(f"Error in setup screens: {e}")
            page.screenshot(path="verification/error_setup.png")
            raise e


        # Wait for game canvas
        try:
            page.wait_for_selector("#gameCanvas", state="visible", timeout=20000)
            print("Game canvas visible")
        except Exception as e:
            print(f"Error waiting for canvas: {e}")
            page.screenshot(path="verification/error_canvas.png")
            # Dump HTML to see what's going on
            with open("verification/error_page.html", "w") as f:
                f.write(page.content())
            raise e

        time.sleep(3) # Wait for init and animations

        # Take initial screenshot
        page.screenshot(path="verification/step0_game_loaded.png")

        viewport_size = page.viewport_size
        center_x = viewport_size['width'] / 2
        center_y = viewport_size['height'] / 2

        print(f"Viewport center: {center_x}, {center_y}")

        # Click near center to select a unit
        print(f"Clicking at {center_x + 80}, {center_y}")
        page.mouse.click(center_x + 80, center_y)
        time.sleep(0.5)

        # Take screenshot of selection
        page.screenshot(path="verification/step1_selected.png")

        # Order move (Right click)
        print(f"Right clicking at {center_x + 200}, {center_y + 100}")
        page.mouse.click(center_x + 200, center_y + 100, button="right")

        # Wait for movement
        time.sleep(1)

        # Take screenshot during movement
        page.screenshot(path="verification/step2_moving.png")

        # Wait more
        time.sleep(2)

        # Final screenshot
        page.screenshot(path="verification/step3_arrived.png")

        browser.close()

if __name__ == "__main__":
    verify_movement()
