const fs = require('fs');
let content = fs.readFileSync('js/core/Game.js', 'utf8');

const replacement = `
        let showBadge = false;
        let badgeIcon = '';
        let cursorClass = '';

        if (this.selectedEntities.length >= 1) { // Palette: Support multiple selection for attack cursor
            // Comprobamos si al menos una entidad puede realizar la acción
            let canAttack = false;
            let canGather = false;
            let canBuild = false;

            for (let i = 0; i < this.selectedEntities.length; i++) {
                const entity = this.selectedEntities[i];
                if (entity.team === 'player' && entity.isUnit) {
                    if (entity.canAttack) canAttack = true;
                    if (entity.canGather && entity.type === 'villager') canGather = true;
                    if (entity.type === 'villager') canBuild = true;
                }
            }

            // Attack Cursor Logic
            if (canAttack) {
                const target = this.enemyUnitGrid.find(
                    this.mouse.worldX,
                    this.mouse.worldY,
                    100, // Search radius increased to cover large entities
                    Game._cursorEnemyPredicate,
                    this
                );

                if (target) {
                    badgeIcon = 'assets/icons/swords.png';
                    cursorClass = 'cursor-attack';
                    showBadge = true;
                }
            }

            // Build/Repair Cursor Logic (Villager only) - Before Gather
            if (!showBadge && canBuild && this.buildingGrid) {
                const target = this.buildingGrid.find(
                    this.mouse.worldX,
                    this.mouse.worldY,
                    100,
                    Game._cursorBuildingPredicate,
                    this
                );

                if (target) {
                    badgeIcon = 'assets/icons/build.png';
                    cursorClass = 'cursor-build';
                    showBadge = true;
                }
            }

            // Gather Cursor Logic (Villager only) - Lower priority than attack
            if (!showBadge && canGather && this.resourceGrid) {
                const res = this.resourceGrid.find(
                    this.mouse.worldX,
                    this.mouse.worldY,
                    50,
                    Game._cursorResourcePredicate,
                    this
                );

                if (res) {
                    // Map resource type to icon
                    if (res.type === 'wood') { badgeIcon = 'assets/icons/wood.png'; cursorClass = 'cursor-chop'; }
                    else if (res.type === 'food') { badgeIcon = 'assets/icons/food.png'; cursorClass = 'cursor-farm'; }
                    else if (res.type === 'gold') { badgeIcon = 'assets/icons/gold.png'; cursorClass = 'cursor-mine'; }
                    else if (res.type === 'stone') { badgeIcon = 'assets/icons/stone.png'; cursorClass = 'cursor-mine'; }
                    else { badgeIcon = 'assets/icons/gold.png'; cursorClass = 'cursor-mine'; }

                    showBadge = true;
                }
            }
        }

        // Apply CSS classes to body
        document.body.classList.remove('cursor-attack', 'cursor-build', 'cursor-chop', 'cursor-farm', 'cursor-mine');
        if (cursorClass) {
            document.body.classList.add(cursorClass);
            if (this.cursorElement) this.cursorElement.style.display = 'none'; // Hide custom DOM cursor
        } else {
            if (this.cursorElement) this.cursorElement.style.display = 'block';
        }

        const cursorImg = this.cursorElement ? this.cursorElement.querySelector('img:not(.cursor-badge)') : null;

        if (showBadge && cursorImg) {
`;

content = content.replace(/        let showBadge = false;\n        let badgeIcon = '';\n\n        if \(this\.selectedEntities\.length >= 1\) \{[\s\S]*?if \(showBadge\) \{/m, replacement);

fs.writeFileSync('js/core/Game.js', content);
console.log('Patched Game.js for cursors');
