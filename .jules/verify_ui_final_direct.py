from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8000/index.html')

        # Inject game start directly to bypass selection screens which seem to have loading issues in headless
        page.evaluate('() => { document.getElementById("startScreen").classList.add("hidden"); document.getElementById("gameScreen").classList.remove("hidden"); window.gameInstance = new Game("romans"); }')

        page.wait_for_timeout(2000)

        # Check if game initialized
        page.screenshot(path='.jules/ui_game_direct.png')
        print("Direct game start screenshot taken")

        browser.close()

if __name__ == '__main__':
    run()
