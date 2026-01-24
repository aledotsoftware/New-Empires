from playwright.sync_api import sync_playwright, expect
import time

def verify_techtree():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:8000/index.html")

        # Wait for the start screen
        expect(page.locator("#startScreen")).to_be_visible()

        # Click "Árbol de Tecnologías" button
        # Using a loose selector because text might have icon
        page.locator("#techTreeButton").click()

        # Wait for modal to appear
        modal = page.locator("#techTreeScreen")
        expect(modal).to_be_visible()

        # Wait a bit for content to render (renderStaticTechTree)
        # Verify that tech items are rendered
        expect(page.locator(".tech-item").first).to_be_visible()

        # Take screenshot of the modal content
        # We capture the modal content div to see the grid
        page.locator(".tech-tree-modal").screenshot(path="verification/techtree.png")

        browser.close()

if __name__ == "__main__":
    verify_techtree()
