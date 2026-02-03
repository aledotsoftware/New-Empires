import time
from playwright.sync_api import sync_playwright

def verify_rally_point():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Block fonts aggressively
        page.route("**/*", lambda route: route.continue_() if "font" not in route.request.resource_type else route.abort())

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            # 1. Navigate
            print("Navigating...")
            page.goto("http://localhost:8081")

            # 2. Start Game Flow
            print("Clicking Start...")
            page.wait_for_selector("#startButton")
            page.get_by_role("button", name="Comenzar Juego").click()

            time.sleep(1)

            # Map Size
            print("Selecting Map Size...")
            page.locator(".map-size-option").first.click()

            time.sleep(1)

            # Civ Selection
            print("Selecting Civ...")
            page.locator(".civ-option").first.click()

            # Wait for game start log
            print("Waiting for game start...")
            time.sleep(5)

            # 3. Locate Town Center
            # Get Canvas Bounds
            canvas_box = page.locator("#gameCanvas").bounding_box()
            print(f"Canvas Box: {canvas_box}")

            # World TC is at (400, 400).
            # Camera is at (0, 0).
            # Screen Offset = Canvas Top/Left.

            target_tc_x = canvas_box['x'] + 400
            target_tc_y = canvas_box['y'] + 400

            print(f"Clicking TC at ({target_tc_x}, {target_tc_y})...")
            page.mouse.click(target_tc_x, target_tc_y)
            time.sleep(0.5)

            # 4. Right click to set Rally Point
            # Click somewhere else, e.g. World (600, 400)
            target_rally_x = canvas_box['x'] + 600
            target_rally_y = canvas_box['y'] + 400

            print(f"Right-clicking at ({target_rally_x}, {target_rally_y})...")
            page.mouse.click(target_rally_x, target_rally_y, button="right")
            time.sleep(1.0)

            # 5. Verify Logic via JS
            print("Verifying rally point state in JS...")
            rally_point = page.evaluate("""() => {
                if (!window.game) return "No Game";
                if (window.game.selectedEntities.length === 0) return "Nothing Selected";
                const ent = window.game.selectedEntities[0];
                if (!ent.rallyPoint) return "No Rally Point";
                return ent.rallyPoint;
            }""")

            print(f"Rally Point State: {rally_point}")

            if isinstance(rally_point, dict) and 'x' in rally_point:
                print("✅ Rally Point successfully set!")
                # World coordinates check
                if abs(rally_point['x'] - 600) < 10 and abs(rally_point['y'] - 400) < 10:
                     print("✅ Coordinates match!")
                else:
                     print(f"⚠️ Coordinates mismatch: Expected (600, 400), got ({rally_point['x']}, {rally_point['y']})")
            else:
                print("❌ Rally Point NOT set.")

            # 6. Screenshot (Try but catch timeout)
            print("Taking screenshot...")
            try:
                page.screenshot(path="verification/rally_point.png", timeout=5000)
                print("Screenshot saved.")
            except Exception as e:
                print(f"Screenshot failed: {e}")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_rally_point()
