from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local index.html
        page.goto(f"http://localhost:3000/index.html")

        # Wait for game to load
        page.wait_for_selector("#startButton")

        # Click Start Game
        page.click("#startButton")

        # Wait for Map Size screen
        page.wait_for_selector("#mapSizeScreen:not(.hidden)")

        # Select 'Normal' map size
        page.click(".map-size-option[data-size='normal']")

        # Wait for Civ Selection screen
        page.wait_for_selector("#civSelectionScreen:not(.hidden)")

        # Check for Random option
        random_civ = page.wait_for_selector(".civ-option[data-civ='random']")
        if random_civ:
            print("✅ Random Civilization option found")

            # Check Text (Spanish) - Case insensitive
            text = random_civ.inner_text()
            if "ALEATORIO" in text.upper():
                 print(f"✅ Random text is correct ({text.strip()})")
            else:
                 print(f"❌ Random text mismatch: {text}")

            # Check Tooltip content via ARIA
            desc_id = random_civ.get_attribute("aria-describedby")
            if desc_id:
                # Use text_content() to get text even if hidden/not rendered visually
                tooltip_text = page.eval_on_selector(f"#{desc_id}", "el => el.textContent")
                if tooltip_text and ("Indeciso" in tooltip_text or "destino" in tooltip_text):
                    print(f"✅ Tooltip description found: {tooltip_text.strip()[:30]}...")
                else:
                    print(f"⚠️ Tooltip text might be wrong or empty: '{tooltip_text}'")

            # Take screenshot
            os.makedirs("verification", exist_ok=True)
            page.screenshot(path="verification/random_civ_spanish.png")
            print("📸 Screenshot saved to verification/random_civ_spanish.png")

        else:
            print("❌ Random Civilization option NOT found")

        browser.close()

if __name__ == "__main__":
    run()
