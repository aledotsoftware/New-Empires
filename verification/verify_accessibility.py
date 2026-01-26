import time
from playwright.sync_api import sync_playwright, expect

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Start Game
        print("Navigating to game...")
        page.goto("http://localhost:8000")

        # Click Start to go to Map Size
        print("Clicking Start...")
        page.click("#startButton")

        # Wait for Map Size screen
        print("Selecting Map Size...")
        page.wait_for_selector("#mapSizeGrid", state="visible")

        page.screenshot(path="verification/step1_map_selection.png")

        # Verify Back Button has aria-keyshortcuts
        print("Verifying Back Button shortcuts...")
        back_btn = page.locator("#backToStartButton")
        expect(back_btn).to_have_attribute("aria-keyshortcuts", "Escape")
        print("✅ Back button has aria-keyshortcuts='Escape'")

        # Verify Map Option has aria-describedby
        print("Verifying Map Option accessibility...")
        map_option = page.locator(".map-size-option").first

        # Get ID of the tooltip
        tooltip = map_option.locator(".card-tooltip")
        tooltip_id = tooltip.get_attribute("id")

        if not tooltip_id:
            print("❌ Tooltip has no ID!")
            exit(1)

        print(f"Tooltip ID found: {tooltip_id}")

        # Check aria-describedby
        expect(map_option).to_have_attribute("aria-describedby", tooltip_id)
        print(f"✅ Map option points to tooltip {tooltip_id}")

        # Click to go to Civ Selection
        map_option.click()

        # Wait for Civ Selection
        print("Selecting Civilization...")
        page.wait_for_selector("#civGrid", state="visible")

        page.screenshot(path="verification/step2_civ_selection.png")

        # Verify Back Button has aria-keyshortcuts
        back_btn_civ = page.locator("#backToMapSizeButton")
        expect(back_btn_civ).to_have_attribute("aria-keyshortcuts", "Escape")
        print("✅ Back to Map button has aria-keyshortcuts='Escape'")

        # Verify Civ Option has aria-describedby
        print("Verifying Civ Option accessibility...")
        civ_option = page.locator(".civ-option").first

        # Get ID of the tooltip
        civ_tooltip = civ_option.locator(".card-tooltip")
        civ_tooltip_id = civ_tooltip.get_attribute("id")

        if not civ_tooltip_id:
            print("❌ Civ Tooltip has no ID!")
            exit(1)

        print(f"Civ Tooltip ID found: {civ_tooltip_id}")

        # Check aria-describedby
        expect(civ_option).to_have_attribute("aria-describedby", civ_tooltip_id)
        print(f"✅ Civ option points to tooltip {civ_tooltip_id}")

        browser.close()
        print("🎉 All Accessibility Tests Passed!")

if __name__ == "__main__":
    run_test()
