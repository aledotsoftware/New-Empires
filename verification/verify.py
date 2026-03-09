from playwright.sync_api import sync_playwright

def test_game(page):
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Error: {err}"))
    page.goto("http://localhost:8000/sim_game.html")
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/screenshot.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        test_game(page)
    finally:
        browser.close()
