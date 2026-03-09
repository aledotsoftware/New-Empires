from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/index.html")

        # Click start button
        page.click("button.btn-start")

        # Wait a bit for the game to start and load assets
        page.wait_for_timeout(2000)

        # Take a screenshot to verify game is running
        page.screenshot(path="verification/game_started.png")


        # We also need to select something to show the UI updates
        page.mouse.click(400, 400) # Town center
        page.wait_for_timeout(500)

        page.screenshot(path="verification/ui_selected.png")

        page.mouse.click(450, 450) # Villager
        page.wait_for_timeout(500)

        page.keyboard.press("b")
        page.wait_for_timeout(500)

        page.screenshot(path="verification/build_menu.png")

        browser.close()

if __name__ == "__main__":
    verify()