from playwright.sync_api import sync_playwright, expect

def verify_drag_counter(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    print("Navigating to game...")
    page.goto("http://localhost:3000")

    # Start Game
    print("Starting game...")
    page.get_by_text("Comenzar Juego").click()

    # Select Map Size (Normal)
    print("Selecting map size...")
    # Wait for map size options
    page.locator(".map-size-option").first.click()

    # Select Civilization (Sumeria - wait for it to populate)
    print("Selecting civilization...")
    page.locator(".civ-option").first.click()

    # Wait for game screen
    print("Waiting for game load...")
    expect(page.locator("#gameScreen")).to_be_visible(timeout=10000)

    # Wait a bit for initialization and fade ins
    page.wait_for_timeout(2000)

    # Drag Selection
    print("Performing drag selection...")
    canvas = page.locator("#gameCanvas")
    box = canvas.bounding_box()

    center_x = box['x'] + box['width'] / 2
    center_y = box['y'] + box['height'] / 2

    # Start top-left of center
    page.mouse.move(center_x - 200, center_y - 200)
    page.mouse.down()

    # Move bottom-right of center (slowly to trigger updates?)
    # Playwright move is instant-ish but triggers events.
    # We want to capture it WHILE dragging.
    page.mouse.move(center_x + 200, center_y + 200)

    # Wait a frame or two?
    page.wait_for_timeout(500)

    # Screenshot with mouse still down (drag active)
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/drag_selection.png")

    page.mouse.up()
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_drag_counter(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
