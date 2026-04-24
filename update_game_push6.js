const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search1 = `            const enemy = new Warrior(ex, ey, 'enemy');
            this._cacheEntityTerrain(enemy); // OPTIMIZATION
            this.enemies.push(enemy);`;

const replace1 = `            const enemy = new Warrior(ex, ey, 'enemy');
            this._cacheEntityTerrain(enemy); // OPTIMIZATION
            this.enemies[this.enemies.length] = enemy;`;

const search2 = `        // Asignar base enemiga si es procedural
        const enemyTC = new TownCenter(enemyStartX, enemyStartY, 'enemy');
        this._cacheEntityTerrain(enemyTC); // OPTIMIZATION
        this.buildings.push(enemyTC);
        this.dropOffPoints.push(enemyTC);
        this.townCenterCounts.enemy++;`;

const replace2 = `        // Asignar base enemiga si es procedural
        const enemyTC = new TownCenter(enemyStartX, enemyStartY, 'enemy');
        this._cacheEntityTerrain(enemyTC); // OPTIMIZATION
        this.buildings[this.buildings.length] = enemyTC;
        this.dropOffPoints[this.dropOffPoints.length] = enemyTC;
        this.townCenterCounts.enemy++;`;

if (content.includes(search1)) {
    content = content.replace(search1, replace1);
    console.log('Search 1 replaced');
}
if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    console.log('Search 2 replaced');
}
fs.writeFileSync(file, content);
