from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        # 1. Load Game
        page.goto("http://localhost:3000")

        # 2. Start Game Flow
        page.click("#startButton")
        page.wait_for_selector(".map-size-option")
        page.click(".map-size-option")
        page.wait_for_selector(".civ-option")
        page.click(".civ-option")
        page.wait_for_selector("#gameCanvas")
        time.sleep(1)

        # 3. Inject Scenario
        page.evaluate("""
            () => {
                const game = window.game;
                if (!game) return;
                const v = game.units.find(u => u.type === 'villager');
                const tc = game.buildings.find(b => b.type === 'townCenter');
                if (v && tc) {
                    v.x = tc.x + 30;
                    v.y = tc.y + 30;
                    v.state = 'CARRYING';
                    v.carryAmount = 10;
                    v.carryType = 'wood';
                    v.dropOffTarget = tc;
                    game.camera.x = tc.x - game.viewWidth / 2;
                    game.camera.y = tc.y - game.viewHeight / 2;
                }
            }
        """)

        time.sleep(0.5)
        page.screenshot(path="verification/floating_text.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
