from playwright.sync_api import sync_playwright

def verify_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Enable console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        page.goto("http://localhost:8080/index.html")

        print("Page loaded. Checking start button...")
        start_btn = page.query_selector("#startButton")
        if start_btn:
            print(f"Start button found: {start_btn.is_visible()}")
            page.click("#startButton")
            print("Clicked start button.")
        else:
            print("Start button NOT found.")
            page.screenshot(path=".jules/verification/debug_no_start.png")
            return

        print("Waiting for map selection...")
        try:
            page.wait_for_selector(".map-size-card", timeout=5000)
            print("Map selection appeared!")
        except Exception as e:
            print(f"Map selection timeout: {e}")
            page.screenshot(path=".jules/verification/debug_timeout.png")
            # Check what IS visible
            content = page.content()
            print("Page Content snippet:", content[:500])

        browser.close()

if __name__ == "__main__":
    verify_debug()
