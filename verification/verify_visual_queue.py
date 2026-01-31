from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})

    # 1. Load Game
    print("Loading game...")
    page.goto("http://localhost:8000")
    page.wait_for_selector("#startButton")

    # 2. Start
    print("Clicking Start...")
    page.click("#startButton")

    # 3. Map Size
    print("Selecting Map Size...")
    page.wait_for_selector(".map-size-option")
    page.click(".map-size-option") # Click first one

    # 4. Civ Selection
    print("Selecting Civ...")
    page.wait_for_selector(".civ-option")
    page.click(".civ-option") # Click first one

    # 5. Wait for Game Screen
    print("Waiting for game screen...")
    page.wait_for_selector("#gameScreen", state="visible")

    # Wait a bit for game init and fade outs
    page.wait_for_timeout(2000)

    # 6. Select Town Center
    print("Selecting Town Center...")
    # Press Space to center camera on TC
    page.keyboard.press("Space")
    page.wait_for_timeout(500)

    # Click center of screen to select it
    page.mouse.click(640, 360)
    page.wait_for_timeout(500)

    # 7. Queue Units
    print("Queuing units...")
    # TC trains Villager with 'Q'
    # Queue 3 villagers
    # First one starts producing, next 2 go to queue
    for _ in range(3):
        page.keyboard.press("q")
        page.wait_for_timeout(200)

    # 8. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/visual_queue.png")

    browser.close()
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
