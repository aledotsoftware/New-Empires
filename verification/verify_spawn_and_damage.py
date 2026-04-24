from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.html")
    page.wait_for_timeout(500)

    # Click start
    page.click('#startButton')
    page.wait_for_timeout(500)

    # Select map
    page.locator('.map-size-option').first.click()
    page.wait_for_timeout(500)

    # Select civ
    civ = page.locator('.civ-option').first
    civ.evaluate("el => el.click()")
    page.wait_for_timeout(2000)

    # Try to select the Town Center by finding a building near center
    page.evaluate("""
        if (window.game) {
            const tc = window.game.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
            if (tc) {
                window.game.selectedEntities = [tc];
                window.game.updateSelectionPanel();
                window.game.updateActionsPanel();
                window.game.focusCamera(tc.x, tc.y);
            }
        }
    """)
    page.wait_for_timeout(1000)

    # Press 'Q' to spawn a villager
    page.keyboard.press('q')
    page.wait_for_timeout(2000) # Wait to see spawn effect

    # Apply some damage to a unit to see damage numbers
    page.evaluate("""
        if (window.game && window.game.units.length > 0) {
            const unit = window.game.units[0];
            window.game.focusCamera(unit.x, unit.y);
            unit.takeDamage(10);
        }
    """)
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
