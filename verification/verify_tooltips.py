from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    # Ensure dir exists
    os.makedirs("verification", exist_ok=True)

    try:
        # 1. Open Game
        page.goto("http://localhost:3000")

        # 2. Start Game
        print("Clicking Start...")
        page.click("#startButton")

        # 3. Select Map Size (Normal)
        print("Waiting for Map Size...")
        page.wait_for_selector("#mapSizeScreen:not(.hidden)")
        page.click(".map-size-option[data-size='normal']")

        # 4. Select Civ
        print("Waiting for Civ Selection...")
        page.wait_for_selector("#civSelectionScreen:not(.hidden)")
        page.wait_for_selector(".civ-option")

        print("Clicking Civ...")
        page.locator(".civ-option").first.click()

        # 5. Wait for Game Screen
        print("Waiting for Game Screen...")
        for i in range(20):
            className = page.evaluate("document.getElementById('gameScreen').className")
            if "hidden" not in className:
                break
            page.wait_for_timeout(500)

        page.wait_for_timeout(2000)

        # 6. Select Villager (Drag Select)
        print("Selecting Villager...")
        page.mouse.move(300, 300)
        page.mouse.down()
        page.mouse.move(700, 600) # Cover the center area
        page.mouse.up()

        page.wait_for_timeout(500)

        selected_count = page.evaluate("game.selectedEntities.length")
        print(f"Selected entities: {selected_count}")

        if selected_count == 0:
            print("Trying fallback selection (comma key for army? no, tab for idle)")
            page.keyboard.press("Tab")
            page.wait_for_timeout(500)
            selected_count = page.evaluate("game.selectedEntities.length")
            print(f"Selected entities after Tab: {selected_count}")

        # 7. Open Build Menu
        print("Opening Build Menu...")
        page.keyboard.press("b")
        page.wait_for_timeout(500)

        # 8. Wait for Build Menu
        # Check class
        menu_class = page.evaluate("document.getElementById('buildMenu').className")
        print(f"Build Menu class: {menu_class}")

        if "hidden" in menu_class:
            print("Menu hidden, trying force click on villager")
            # Maybe we selected the Town Center?
            # Villager only for build menu.
            # Tab should select idle villager.
            pass

        page.wait_for_selector("#buildMenu", state="visible", timeout=5000)

        # 9. Hover over House option to show tooltip
        print("Hovering House...")
        house_option = page.locator(".build-option[data-building='house']")
        house_option.hover()

        # 10. Wait for tooltip transition (0.5s)
        page.wait_for_timeout(1000)

        # 11. Take Screenshot
        page.screenshot(path="verification/build_tooltip.png")
        print("Screenshot taken: verification/build_tooltip.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        print("Error screenshot taken: verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
