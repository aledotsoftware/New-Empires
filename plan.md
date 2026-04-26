1. **Fix Archer Kiting Bug (`js/entities/units/Archer.js`)**
   - The archer kiting logic temporarily detaches `attackTarget` and `explicitTarget`, then calls `super.update()`. In `super.update()`, because `explicitTarget` is false, it calls `scanForEnemies()`, re-acquires the target, and immediately moves back towards it. This nullifies the escape movement. I will fix this by removing the `super.update()` call entirely when kiting is active, ensuring the cooldown timer is decremented manually. I will use `replace_with_git_merge_diff` to apply the fix.

2. **Improve Attack-Move and Retreat Commands (`js/core/Game.js`)**
   - In `Game.js`'s `handleRightClick`, clicking the ground to move currently sets `explicitTarget = false`. This causes units to stop and attack enemies during a retreat because they are evaluated as "not busy".
   - I will change this so that a standard right-click sets `explicitTarget = true` (forcing them to ignore enemies and reach the destination).
   - I will implement an Attack-Move behavior: if the 'A' key or 'Shift' key is held while right-clicking, `explicitTarget` will be set to `false`, allowing them to stop and fight enemies they encounter on the way. I will use `replace_with_git_merge_diff` to apply the modifications in `handleRightClick`.

3. **Improve Melee Blockages and Front-line Spacing (`js/entities/Unit.js`)**
   - The separation logic currently applies a strong force `const sepForce = (effectiveSpeed * deltaTime) * 1.5;`. This is great for marching but causes melee units at the front line to push each other out of attack range.
   - I will modify this logic with `replace_with_git_merge_diff` to conditionally reduce the `sepForce` (e.g., multiplier of `0.2` instead of `1.5`) when the unit is close to its `attackTarget` (e.g. `this.attackTarget && Math.abs(this.x - this.attackTarget.x) < 100 && Math.abs(this.y - this.attackTarget.y) < 100`).

4. **Enhance Target Evaluation and Stickiness (`js/entities/Unit.js`)**
   - The target stickiness logic gives a massive `+2000` score to the current target if it's in range, but still gives a `+100` score if it's out of range.
   - I will adjust the logic with `replace_with_git_merge_diff` to drop stickiness when the target moves out of the `attackRangeSq`, changing the `+100` penalty to `-500`, allowing melee units in the 2nd/3rd row to quickly switch to closer enemies rather than trying to walk through allies to reach their original target.

5. **Test the changes**
   - Execute all the verification scripts in the `verification/` folder and visually test via a live server using `npx playwright test`. Ensure no regressions are found and performance benchmarks look good.

6. **Complete pre commit steps**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit Changes**
   - Use `submit` to push the changes to the user's branch.
