from playwright.sync_api import sync_playwright
import time

def verify_cursor_badge():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Enable console logs
        page.on("console", lambda msg: print(f"BROWSER: {msg.text}"))

        page.goto("http://localhost:8080/index.html")

        # Start Game Flow
        print("Clicking Start...")
        page.wait_for_selector("#startButton")
        page.click("#startButton")

        print("Selecting Map...")
        # Use generic selector for grid items
        page.wait_for_selector("#mapSizeGrid > div")
        page.click("#mapSizeGrid > div:first-child")

        print("Selecting Civ...")
        page.wait_for_selector("#civGrid > div")
        page.click("#civGrid > div:first-child")

        print("Waiting for Game...")
        page.wait_for_selector("#gameCanvas")

        # Wait for game init
        page.wait_for_timeout(3000)

        # DEBUG: Check if cursor badge exists
        badge_exists = page.evaluate("""
            () => {
                const cursor = document.getElementById('customCursor');
                return cursor && cursor.querySelector('.cursor-badge') !== null;
            }
        """)
        print(f"Cursor Badge Element Exists: {badge_exists}")

        # TEST 1: GATHER (Wood)
        print("Testing Gather Cursor...")
        page.evaluate("""
            () => {
                const game = window.game;
                if(!game) return console.error("No game object");

                // Find a villager
                const villager = game.units.find(u => u.type === 'villager' && u.team === 'player');
                if (villager) {
                    game.selectedEntities = [villager];
                    // Force UI update
                    game.updateSelectionPanel();
                    game.updateActionsPanel();
                } else {
                    console.error("No villager found");
                }

                // Find a tree
                const tree = game.resourceNodes.find(r => r.type === 'wood' && r.amount > 0);
                if (tree) {
                    // Set mouse to tree position
                    // We need to account for camera
                    const screenX = tree.x - game.camera.x;
                    const screenY = tree.y - game.camera.y;

                    game.mouse.worldX = tree.x;
                    game.mouse.worldY = tree.y;
                    game.mouse.x = screenX;
                    game.mouse.y = screenY;

                    // Update cursor state
                    if(game.updateCursorState) game.updateCursorState();

                    // Move visual cursor for screenshot (the DOM element)
                    const cursorEl = document.getElementById('customCursor');
                    if(cursorEl) {
                        cursorEl.style.left = screenX + 'px';
                        cursorEl.style.top = screenY + 'px';
                    }
                } else {
                    console.error("No tree found");
                }
            }
        """)

        # Allow DOM update
        page.wait_for_timeout(500)
        page.screenshot(path=".jules/verification/cursor_badge_gather.png")

        # TEST 2: ATTACK (Enemy)
        print("Testing Attack Cursor...")
        page.evaluate("""
            () => {
                const game = window.game;

                // Ensure we have a unit capable of attacking
                // Hack: Make the selected villager a warrior temporarily or use a warrior
                const unit = game.selectedEntities[0];
                if(unit) {
                    unit.canAttack = true;
                    // unit.type = 'warrior'; // Optional visual change
                }

                // Find enemy
                let enemy = game.enemies[0];
                if (!enemy) {
                    // Create dummy enemy if none
                    enemy = {x: 500, y: 500, size: 20, team: 'enemy', isDead: false};
                    game.enemies.push(enemy);
                    // Add to spatial grid if needed (Game.js logic uses spatialGrid, game.js uses loop)
                    if(game.spatialGrid) game.spatialGrid.add(enemy);
                }

                if (enemy) {
                    const screenX = enemy.x - game.camera.x;
                    const screenY = enemy.y - game.camera.y;

                    game.mouse.worldX = enemy.x;
                    game.mouse.worldY = enemy.y;
                    game.mouse.x = screenX;
                    game.mouse.y = screenY;

                    if(game.updateCursorState) game.updateCursorState();

                    const cursorEl = document.getElementById('customCursor');
                    if(cursorEl) {
                        cursorEl.style.left = screenX + 'px';
                        cursorEl.style.top = screenY + 'px';
                    }
                }
            }
        """)

        page.wait_for_timeout(500)
        page.screenshot(path=".jules/verification/cursor_badge_attack.png")

        browser.close()

if __name__ == "__main__":
    verify_cursor_badge()
