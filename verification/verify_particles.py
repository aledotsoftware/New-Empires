
from playwright.sync_api import sync_playwright
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Start Application
            print("Navigating to game...")
            page.goto("http://localhost:3000")

            # 2. Start Screen -> Map Size
            print("Clicking Start Game...")
            page.click("#startButton")
            page.wait_for_selector("#mapSizeScreen:not(.hidden)", timeout=5000)

            # 3. Map Size -> Civ Selection
            print("Selecting Map Size...")
            # Assuming there is a map size option, picking the first one
            page.click(".map-size-option")
            page.wait_for_selector("#civSelectionScreen:not(.hidden)", timeout=5000)

            # 4. Civ Selection -> Game
            print("Selecting Civilization...")
            # Check if civ options exist
            if page.locator(".civ-option").count() == 0:
                print("No civ options found!")
                page.screenshot(path="verification/debug_no_civs.png")
                raise Exception("No civ options")

            page.click(".civ-option >> nth=0")

            # 5. Wait for Game Screen
            print("Waiting for game screen...")
            page.wait_for_selector("#gameScreen:not(.hidden)", timeout=10000)

            # 6. Wait for Game Object
            print("Waiting for game object...")
            page.wait_for_function("window.game !== undefined")

            # 7. Spawn Particles
            print("Spawning particles...")
            page.evaluate("""
                if (window.game && window.game.particleSystem) {
                    // Emoji particles (Wood)
                    window.game.particleSystem.createResourceEffect(400, 400, 'wood');
                    // Shape particles (Explosion)
                    window.game.particleSystem.createExplosion(450, 400, '#ff0000');
                } else {
                    console.error("Game or ParticleSystem not found!");
                }
            """)

            # Wait a brief moment for render loop to process
            time.sleep(0.5)

            # 8. Screenshot
            print("Taking screenshot...")
            screenshot_path = "verification/particles_check.png"
            page.screenshot(path=screenshot_path)

            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/debug_failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        exit(1)
