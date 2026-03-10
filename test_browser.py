from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    page.wait_for_timeout(2000)

    page.locator("#settingsButtonStart").click(force=True)
    page.wait_for_timeout(1000)

    is_hidden = page.evaluate("document.getElementById('settingsScreen').classList.contains('hidden')")
    print(f"Settings modal is hidden: {is_hidden}")

    browser.close()
