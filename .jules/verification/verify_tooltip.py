
from playwright.sync_api import sync_playwright

def verify_tooltip_color():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Increase viewport to ensure elements are visible
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to the game
        page.goto("http://localhost:3000/index.html")

        # Wait for game initialization
        page.wait_for_timeout(2000)

        # Click "Start Game" to load the main game interface
        start_btn = page.locator("#startButton")
        if start_btn.is_visible():
            start_btn.click()
            page.wait_for_timeout(1000)

        # Select map size (Normal)
        map_size_card = page.locator(".map-size-card[data-size='normal']")
        if map_size_card.is_visible():
            map_size_card.click()
            page.wait_for_timeout(1000)

        # Select civilization (first one)
        civ_card = page.locator(".civ-card").first
        if civ_card.is_visible():
            civ_card.click()
            page.wait_for_timeout(3000) # Wait for game loop to start and assets to load

        # Inject a scenario to test tooltip behavior
        page.evaluate("""
            const game = window.game;
            if (game) {
                // Find town center
                const tc = game.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
                if (tc) {
                    game.selectedEntities = [tc];
                }

                // Force resources to be low to trigger red text
                game.resources.food = 0;
                game.resources.wood = 0;

                // Force update UI
                game.updateUI();
                game.updateActionsPanel();
            }
        """)

        page.wait_for_timeout(1000)

        # Check if we have buttons
        buttons = page.locator("#commandPanel .action-btn")
        count = buttons.count()
        print(f"Buttons found: {count}")

        if count > 0:
            btn = buttons.first
            # Force focus to trigger tooltip visibility via CSS :focus-visible logic if hover fails in headless
            btn.focus()

            # Hover to show tooltip
            btn.hover()
            page.wait_for_timeout(1000)

            # Screenshot the whole page to see the HUD
            page.screenshot(path=".jules/verification/tooltip_verification.png")
            print("Screenshot taken.")
        else:
            print("No buttons found in command panel.")
            # Take screenshot for debugging
            page.screenshot(path=".jules/verification/debug_no_buttons.png")

        browser.close()

if __name__ == "__main__":
    try:
        verify_tooltip_color()
        print("Verification script executed.")
    except Exception as e:
        print(f"Error executing verification script: {e}")
