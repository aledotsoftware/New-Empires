from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Click start game
        page.locator('button', has_text='COMENZAR JUEGO').click()
        page.wait_for_timeout(3000)

        # Take a screenshot
        page.screenshot(path="verification/game_started.png")
        browser.close()

if __name__ == "__main__":
    verify()
