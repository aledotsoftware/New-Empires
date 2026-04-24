const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `        this._cacheEntityTerrain(townCenter); // OPTIMIZATION
        this.buildings.push(townCenter);
        this.dropOffPoints.push(townCenter);`;

const replace = `        this._cacheEntityTerrain(townCenter); // OPTIMIZATION
        this.buildings[this.buildings.length] = townCenter;
        this.dropOffPoints[this.dropOffPoints.length] = townCenter;`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 1).');
} else {
    console.log('Search block push 1 not found.');
}

const search2 = `            civilizationManager.applyUnitBonuses(villager, this.civilizationId);
            this._cacheEntityTerrain(villager); // OPTIMIZATION
            this.units.push(villager);
        }`;

const replace2 = `            civilizationManager.applyUnitBonuses(villager, this.civilizationId);
            this._cacheEntityTerrain(villager); // OPTIMIZATION
            this.units[this.units.length] = villager;
        }`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 2).');
} else {
    console.log('Search block push 2 not found.');
}
