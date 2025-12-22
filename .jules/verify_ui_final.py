from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the game
        page.goto('http://localhost:8000/index.html')

        # Click start button to enter game
        page.click('#startButton')

        # Wait for map selection
        page.wait_for_selector('#mapSizeScreen')
        page.click('.map-size-card') # Select first map size

        # Wait for civ selection
        page.wait_for_selector('#civSelectionScreen')
        page.click('.civ-option') # Select first civ

        # Wait for game screen
        page.wait_for_selector('#gameCanvas')

        # Wait for initialization
        page.wait_for_timeout(2000)

        # Take screenshot of UI
        page.screenshot(path='.jules/ui_game_running.png')
        print("Game running screenshot taken")

        # Simulate interaction
        viewport = page.viewport_size
        center_x = viewport['width'] / 2
        center_y = viewport['height'] / 2

        # Click center (TC)
        page.mouse.click(center_x, center_y)
        page.wait_for_timeout(200)
        page.screenshot(path='.jules/ui_game_selected.png')
        print("Selection screenshot taken")

        browser.close()

if __name__ == '__main__':
    run()
