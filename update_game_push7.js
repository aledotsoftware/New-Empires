const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `            this._cacheEntityTerrain(building); // OPTIMIZATION
            this.buildings.push(building);
            this.buildingGrid.add(building);`;

const replace = `            this._cacheEntityTerrain(building); // OPTIMIZATION
            this.buildings[this.buildings.length] = building;
            this.buildingGrid.add(building);`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 8).');
} else {
    console.log('Search block push 8 not found.');
}

const search2 = `            // BOLT OPTIMIZATION: Add to drop-off cache
            if (building.type === 'townCenter' || building.type === 'storage' || building.type === 'storageWood') {
                this.dropOffPoints.push(building);
            }`;

const replace2 = `            // BOLT OPTIMIZATION: Add to drop-off cache
            if (building.type === 'townCenter' || building.type === 'storage' || building.type === 'storageWood') {
                this.dropOffPoints[this.dropOffPoints.length] = building;
            }`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 9).');
} else {
    console.log('Search block push 9 not found.');
}
