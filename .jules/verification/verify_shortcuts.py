from playwright.sync_api import sync_playwright

def verify_shortcuts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        # Note: We need absolute path or file:// protocol
        import os
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Inject CSS to make the build menu visible immediately for screenshot
        # The game logic would normally toggle this, but we want to verify the static HTML/CSS
        page.add_style_tag(content="""
            #buildMenu { display: flex !important; visibility: visible !important; opacity: 1 !important; }
            .hidden { display: block !important; }
        """)

        # Wait for fonts/styles
        page.wait_for_timeout(1000)

        # Take screenshot of the build menu
        element = page.locator(".build-grid")
        if element.is_visible():
            element.screenshot(path=".jules/verification/build_menu_shortcuts.png")
            print("Screenshot saved to .jules/verification/build_menu_shortcuts.png")
        else:
            print("Build menu not visible")
            # Fallback full page
            page.screenshot(path=".jules/verification/full_page_debug.png")

        browser.close()

if __name__ == "__main__":
    verify_shortcuts()
