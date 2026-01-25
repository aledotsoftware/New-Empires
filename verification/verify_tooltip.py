
import os
from playwright.sync_api import sync_playwright

def verify_tooltip():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # 1. Load Game
        page.goto("http://localhost:8080/index.html")

        # 2. Start Game Flow
        page.click("#startButton")
        page.wait_for_timeout(1000) # Wait for animation

        # Select Map Size
        page.click(".map-size-option[data-size='normal']")
        page.wait_for_timeout(500)

        # Select Civ
        page.click(".civ-option[data-civ='romans']") # Romans is default in constructor, safe bet

        # Wait for game screen
        page.wait_for_selector("#gameCanvas")
        page.wait_for_timeout(2000) # Wait for init

        # 3. Trigger Tooltip
        # Hover over population resource item
        # Identifier from index.html: class="resource-item resource-population"
        pop_resource = page.locator(".resource-population")
        pop_resource.hover()

        # Wait for tooltip to appear (css transition)
        page.wait_for_timeout(500)

        # 4. Screenshot
        # Take a screenshot of the top panel specifically, or the whole page
        page.screenshot(path="verification/tooltip_verification.png")

        # Also print the tooltip content to console for text verification
        tooltip = page.locator("#popTooltip")
        print("Tooltip Content:", tooltip.inner_html())

        browser.close()

if __name__ == "__main__":
    verify_tooltip()
