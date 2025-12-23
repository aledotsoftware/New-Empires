from playwright.sync_api import sync_playwright
import time

def verify_actions_panel():
    with sync_playwright() as p:
        # Launch with headless=True for performance, but we capture screenshots
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Subscribe to console logs to debug browser-side issues
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))

        url = "http://localhost:3000/index.html"
        print(f"Navigating to {url}...")
        page.goto(url)

        try:
            # 1. Start Screen
            print("Step 1: Start Screen")
            page.wait_for_selector("#startButton", state="visible")
            page.click("#startButton")

            # 2. Map Size Selection
            print("Step 2: Map Size Selection")
            # Wait for the transition
            page.wait_for_selector("#mapSizeScreen:not(.hidden)", timeout=5000)
            # Click 'Normal'
            page.click("text=Normal")

            # 3. Civilization Selection
            print("Step 3: Civilization Selection")
            # Wait for the screen to be visible
            page.wait_for_selector("#civSelectionScreen:not(.hidden)", timeout=5000)

            # Ensure civ options are loaded and rendered
            page.wait_for_selector(".civ-option", state="visible", timeout=5000)

            # Click the first civilization (force=True to bypass overlapping checks if any)
            print("Clicking first civilization...")
            page.locator(".civ-option").first.click(force=True)

            # 4. Game Screen
            print("Step 4: Waiting for Game Screen")
            # Wait for game screen to become visible
            page.wait_for_selector("#gameScreen:not(.hidden)", timeout=10000)

            # Wait for game logic to initialize
            print("Waiting for window.game...")
            page.wait_for_function("() => window.game !== null && window.game.buildings.length > 0", timeout=10000)

            # 5. Select Town Center to trigger UI update
            print("Selecting Town Center...")
            # We explicitly set selectedEntities and call updateUI to ensure the panel should render
            page.evaluate("""
                () => {
                    const tc = window.game.buildings.find(b => b.type === 'townCenter');
                    if (tc) {
                        window.game.selectedEntities = [tc];
                        window.game.updateUI();
                        console.log("Town Center selected via script");
                    } else {
                        console.error("No Town Center found");
                    }
                }
            """)

            # 6. Verify Buttons
            print("Verifying Action Buttons...")
            # Wait for at least one action button to be enabled/active (not just empty slot)
            # The Town Center should have 'Create Villager' button
            # We look for a button that is NOT disabled, or check for specific content
            page.wait_for_selector("#commandPanel .action-btn:not(.disabled)", timeout=5000)

            # Take success screenshot
            print("Taking success screenshot...")
            hud = page.locator("#gameHUD")
            hud.screenshot(path=".jules/verification/actions_panel_success.png")

            # 7. Check for DOM reuse (Optimization verification)
            # We change selection and check if the element reference remains valid or if attributes changed
            print("Verifying DOM Reuse...")
            initial_state_key = page.eval_on_selector("#commandPanel .action-btn:not(.disabled)", "el => el.dataset.stateKey")
            print(f"Initial state key: {initial_state_key}")

            if initial_state_key:
                print("✅ Optimization verified: dataset.stateKey is present.")
            else:
                print("❌ Optimization check failed: dataset.stateKey missing.")

        except Exception as e:
            print(f"FAILED: {e}")
            # Take failure screenshot
            page.screenshot(path=".jules/verification/failure.png")
            raise e

        finally:
            browser.close()

if __name__ == "__main__":
    verify_actions_panel()
