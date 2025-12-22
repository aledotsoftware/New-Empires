from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the game
        page.goto('http://localhost:8000/index.html')

        # Wait for game to initialize (check for game time or canvas)
        page.wait_for_selector('#gameCanvas')

        # Wait a bit for the loop to run a few times
        page.wait_for_timeout(1000)

        # Take screenshot of the initial UI
        page.screenshot(path='.jules/ui_initial.png')
        print("Initial screenshot taken")

        # Simulate clicking on the Town Center (center of map usually)
        # We need to click on the canvas where the TC is (400, 400 is the spawn point in Game.js)
        # Adjusting for camera, the TC is likely at the center of the view initially.
        # Game.js: this.camera.x = 400 - this.viewWidth / 2;
        # So TC (400, 400) should be at center of screen.

        viewport = page.viewport_size
        center_x = viewport['width'] / 2
        center_y = viewport['height'] / 2

        page.mouse.click(center_x, center_y)

        # Wait for selection panel to update
        page.wait_for_timeout(500)

        # Screenshot with selection
        page.screenshot(path='.jules/ui_selection.png')
        print("Selection screenshot taken")

        browser.close()

if __name__ == '__main__':
    run()
