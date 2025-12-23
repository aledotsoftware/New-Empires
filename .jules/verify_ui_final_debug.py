from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8000/index.html')

        # Start game
        page.click('#startButton')
        page.wait_for_timeout(1000)

        # Check if map size screen is visible
        if page.is_visible('#mapSizeScreen'):
            print("Map size screen visible")
            # Click first map size card
            page.click('.map-size-card')
            page.wait_for_timeout(1000)
        else:
            print("Map size screen NOT visible")
            page.screenshot(path='.jules/debug_map_screen.png')

        # Check if civ selection is visible
        if page.is_visible('#civSelectionScreen'):
            print("Civ selection screen visible")
            # Wait for civ options to be populated
            page.wait_for_selector('.civ-option', timeout=5000)
            page.click('.civ-option')
        else:
            print("Civ selection screen NOT visible")
            page.screenshot(path='.jules/debug_civ_screen.png')

        # Wait for game
        page.wait_for_timeout(2000)
        page.screenshot(path='.jules/ui_game_running_debug.png')

        browser.close()

if __name__ == '__main__':
    run()
