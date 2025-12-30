from playwright.sync_api import sync_playwright

def verify_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html")

        # Bypass menus by executing JS
        page.evaluate("document.getElementById('startScreen').classList.add('hidden');")
        page.evaluate("document.getElementById('gameScreen').classList.remove('hidden');")
        page.evaluate("startGame({id:'romans', name:'Romans', bonuses:{}, uniqueUnit:{icon:'test'}});")

        page.wait_for_timeout(2000)

        # Force selection
        page.evaluate("""
            if(window.game && window.game.units.length > 0) {
                window.game.selectedEntities = [window.game.units[0]];
                window.game.updateActionsPanel();
            }
        """)

        # Wait for buttons - use state attached to avoid 'detached' error if re-rendering happens fast
        try:
            # Wait for button to exist
            btn_loc = page.locator(".action-btn:not(.disabled)").first
            btn_loc.wait_for(state="attached", timeout=5000)

            # Force hover via JS dispatchEvent if native hover is flaky due to re-renders
            # or try native hover again with catch
            try:
                btn_loc.hover(force=True, timeout=2000)
            except:
                print("Hover failed, trying JS hover")
                btn_loc.evaluate("el => el.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))")
                # Also focus it
                btn_loc.focus()

            page.wait_for_timeout(1000)
            page.screenshot(path="verification/tooltip_verification_clean.png")
            print("Screenshot saved")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/failed_state_clean.png")

        browser.close()

if __name__ == "__main__":
    verify_tooltips()
