from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()

    # 1. Load the game
    print("Loading game...")
    page.goto("http://localhost:3000")

    # 2. Wait for Start Button
    print("Waiting for start button...")
    page.wait_for_selector("#startButton")
    page.click("#startButton")

    # 3. Wait for Map Size (Medium default)
    print("Selecting map size...")
    # Wait for .map-size-option to appear
    page.wait_for_selector(".map-size-option", state="visible")
    # Click Medium (assuming it's one of them, or just the first)
    page.locator(".map-size-option").nth(1).click() # Medium is usually 2nd

    # 4. Wait for Civ Selection
    print("Selecting civilization...")
    page.wait_for_selector(".civ-option", state="visible")
    page.locator(".civ-option").first.click()

    # 5. Wait for Game Canvas
    print("Waiting for game canvas...")
    page.wait_for_selector("#gameCanvas", state="visible")

    # 6. Wait a bit for rendering loop to run
    print("Waiting for rendering...")
    page.wait_for_timeout(2000)

    # 7. Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/game_render.png")

    # 8. Verify resource counts are visible (DOM check)
    wood = page.locator("#woodCount").text_content()
    print(f"Wood: {wood}")

    browser.close()
    print("Verification complete.")

with sync_playwright() as playwright:
    run(playwright)
