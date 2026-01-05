from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game (assuming it's running on port 3000)
        page.goto("http://localhost:3000/index.html")

        # Wait for the Start Button to be visible (game loaded)
        page.wait_for_selector("#startButton")

        # Click "Start Game" to go to Map Selection
        page.click("#startButton")

        # Wait for map size selection screen
        page.wait_for_selector("#mapSizeScreen:not(.hidden)")

        # Take a screenshot of the Map Size screen (verifies refactored showMapSizeSelection)
        page.screenshot(path=".jules/verification/1_map_size_screen.png")
        print("Captured Map Size Screen")

        # Select "Normal" map size (click the card with data-size="normal")
        # Try both classes because main.js and game.js use different ones
        try:
            page.click(".map-size-option[data-size='normal']", timeout=2000)
        except:
            page.click(".map-size-card[data-size='normal']")

        # Wait for Civ Selection screen
        page.wait_for_selector("#civSelectionScreen:not(.hidden)")

        # Select a civilization (e.g., Romans)
        # Try both selector patterns
        try:
             page.click(".civ-option", timeout=2000)
        except:
             page.click(".civ-card")

        # Wait for game screen
        page.wait_for_selector("#gameScreen:not(.hidden)")

        # Open Tech Tree (using global function exposed to window)
        # We can trigger it via the button if visible or execute JS
        # The tech tree button is on the start screen usually, but here we are in game.
        # Let's try to find a way to open tech tree or execute JS.

        # Actually, let's just execute the JS command since we have console access effectively
        page.evaluate("window.showTechTree()")

        # Wait for tech tree modal
        page.wait_for_selector("#techTreeScreen:not(.hidden)")

        # Wait for content to render.
        # Since main.js and game.js might conflict, main.js uses .tech-item and game.js uses .tech-card-compact
        # We'll wait for either.
        try:
            page.wait_for_selector(".tech-card-compact", timeout=5000)
        except:
            page.wait_for_selector(".tech-item", timeout=5000)

        # Take a screenshot of the Tech Tree (verifies refactored renderTechTree and createCompactTechCard)
        page.screenshot(path=".jules/verification/2_tech_tree_screen.png")
        print("Captured Tech Tree Screen")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
