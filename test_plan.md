1. **Fix Attack-Move and Retreat logic (`js/core/Game.js` and `js/entities/Unit.js`)**
   - Update `Game.js` to respect Attack-Move (e.g. holding 'A') versus standard move. Standard move should force units to ignore enemies and proceed to their destination (retreating).
   - Update `Unit.js` `update()` to give absolute priority to forced movement (`targetX !== null && explicitTarget === true`), skipping the attack logic until they arrive at the destination.

2. **Fix Archer Kiting Bug (`js/entities/units/Archer.js`)**
   - Archers currently call `super.update()` while kiting, which forces them to immediately walk back towards the enemy they are trying to escape from. This will be fixed by skipping the `super.update()` call entirely when kiting is active, ensuring proper hit-and-run tactics without repositioning errors.

3. **Improve Melee Blockages and Spacing (`js/entities/Unit.js`)**
   - Reduce the soft separation force dramatically (by 80%) when units are close to their attack target (`distSq < attackRangeSq * 1.5`). This allows the wide melee ranges (~60-70px) to function correctly without units pushing each other backward out of range, preventing pathing deadlocks on the front line.

4. **Complete Pre-Commit Verifications**
   - Run the full suite of verification tests and linting to ensure combat and performance haven't regressed.

5. **Submit Changes**
   - Submit the changes with an appropriate commit message.
