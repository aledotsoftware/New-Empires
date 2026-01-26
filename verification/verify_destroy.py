from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})

    print("Navigating...")
    page.goto("http://localhost:8000")

    print("Clicking Start...")
    page.click("#startButton")

    print("Selecting Map...")
    page.wait_for_selector(".map-size-option", state="visible")
    page.click(".map-size-option")

    print("Selecting Civ...")
    page.wait_for_selector(".civ-option", state="visible")
    page.click(".civ-option")

    print("Waiting for Game...")
    page.wait_for_selector("#gameCanvas", state="visible")
    time.sleep(2)

    # Force selection of the first building (Town Center)
    print("Forcing selection via JS...")
    page.evaluate("""
        const tc = window.game.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
        if (tc) {
            window.game.selectedEntities = [tc];
            window.game.updateSelectionPanel();
            window.game.updateActionsPanel();
        }
    """)

    time.sleep(0.5)

    # 6. Check for Destroy Button
    print("Checking for Destroy Button...")
    destroy_btn = page.locator('button[aria-label^="Destruir"]')

    try:
        destroy_btn.wait_for(state="visible", timeout=2000)
        print("✅ Destroy button found!")
    except:
        print("❌ Destroy button NOT found!")
        buttons = page.query_selector_all("#commandPanel button")
        for btn in buttons:
            label = btn.get_attribute('aria-label')
            if label:
                print(f"Button: {label}")

    page.screenshot(path="verification/step1_button_visible.png")

    # 7. Click Destroy
    if destroy_btn.is_visible():
        print("Clicking Destroy...")
        destroy_btn.click()

        # 8. Check Confirmation
        print("Checking Confirmation Modal...")
        page.wait_for_selector("#confirmationModal", state="visible")
        modal = page.locator("#confirmationModal")

        if modal.is_visible():
            print("✅ Confirmation modal visible!")

            # Confirm destruction
            print("Confirming destruction...")
            page.click("#confirmYesBtn")

            time.sleep(0.5)

            # Verify entity is dead/removed
            is_dead = page.evaluate("""
                const tc = window.game.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
                !tc || tc.isDead
            """)

            if is_dead:
                print("✅ Entity destroyed!")
            else:
                print("❌ Entity still alive!")

        else:
            print("❌ Confirmation modal NOT visible!")

        page.screenshot(path="verification/step2_confirmation.png")
    else:
        print("Skipping click test.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
