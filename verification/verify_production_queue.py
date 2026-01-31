import os
import time
from playwright.sync_api import sync_playwright, expect

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        print("Navigating to game...")
        # Start Game
        page.click("#startButton")
        page.click(".map-size-option")
        page.click(".civ-option")
        page.wait_for_selector("#gameCanvas", state="visible")
        time.sleep(2)

        # Ensure focus
        page.click("#gameCanvas")

        print("Focusing Town Center...")
        # Focus Town Center (Space)
        page.keyboard.press("Space")
        time.sleep(0.5)

        # Check if Town Center is selected
        sel_info = page.locator("#selectionContent .selection-info h3")
        expect(sel_info).to_contain_text("Centro Urbano")

        print("Queueing 2 Villagers (Hit pop limit)...")
        # Train 2 Villagers (Q hotkey)
        # Pop is 3/5. +2 = 5/5.
        page.keyboard.press("q")
        time.sleep(0.1)
        page.keyboard.press("q")
        time.sleep(0.5)

        # Verify Queue Visualization
        print("Verifying Queue Visualization...")
        # There should be a queue list now
        queue_list = page.locator(".queue-list")
        expect(queue_list).to_be_visible()

        # Should have 1 item in queue list (since 1 is current, 1 is queued)
        items = queue_list.locator(".queue-item")
        expect(items).to_have_count(1)

        # Verify Tooltip/Label
        first_item = items.first
        # aria-label should correspond to cancel action
        label = first_item.get_attribute("aria-label")
        print(f"Tooltip label: {label}")
        expect(first_item).to_have_attribute("aria-label", "Cancelar villager")

        # Click to Cancel
        print("Cancelling one item...")
        first_item.click()
        time.sleep(0.5)

        # Verify count decreased to 0
        expect(items).to_have_count(0)
        print("✅ Item cancelled successfully")

        # Screenshot
        page.screenshot(path="verification/production_queue_verified.png")

        browser.close()

if __name__ == "__main__":
    run_test()
