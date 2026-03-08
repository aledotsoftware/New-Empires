from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000/sim_game.html')
    page.wait_for_timeout(2000)
    print("Page title:", page.title())
    browser.close()
