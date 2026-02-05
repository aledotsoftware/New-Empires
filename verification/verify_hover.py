import os
import time
import subprocess
from playwright.sync_api import sync_playwright

def run_verification():
    subprocess.run(["pkill", "-f", "python3 -m http.server"], capture_output=True)
    server = subprocess.Popen(["python3", "-m", "http.server", "8081"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})

            page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

            print("Navigating...")
            page.goto("http://localhost:8081")

            print("Clicking Start...")
            page.wait_for_selector("#startButton")
            page.click("#startButton")

            print("Selecting Map...")
            page.wait_for_selector(".map-size-option[data-size='normal']")
            page.click(".map-size-option[data-size='normal']")

            print("Selecting Civ...")
            page.wait_for_selector(".civ-option")
            page.click(".civ-option")

            print("Waiting for Game (20s timeout)...")
            page.wait_for_selector("#gameScreen:not(.hidden)", timeout=20000)

            # Wait for game loop to stabilize
            time.sleep(5)

            print("Moving Mouse to Center (Hovering TC)...")
            page.mouse.move(640, 360)

            # Force a frame update (if needed)
            page.evaluate("if(window.game) window.game.update(0.016)")

            time.sleep(1)

            print("Taking Screenshot...")
            # Disable animations to avoid waiting for them
            page.screenshot(path="verification/hover_highlight.png", animations="disabled")
            print("Done.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.terminate()

if __name__ == "__main__":
    run_verification()
