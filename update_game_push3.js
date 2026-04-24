const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `                // Update counts
                if (entity.team === 'player') {
                    this._updateBuildingCount(entity.type, 1);
                    if (entity.type === 'townCenter' || entity.type === 'storage' || entity.type === 'storageWood') {
                        this.dropOffPoints.push(entity);
                    }
                }`;

const replace = `                // Update counts
                if (entity.team === 'player') {
                    this._updateBuildingCount(entity.type, 1);
                    if (entity.type === 'townCenter' || entity.type === 'storage' || entity.type === 'storageWood') {
                        this.dropOffPoints[this.dropOffPoints.length] = entity;
                    }
                }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 3).');
} else {
    console.log('Search block push 3 not found.');
}

const search2 = `            // Add to main lists
            list.push(entity);
            if (grid) grid.add(entity);
        };`;

const replace2 = `            // Add to main lists
            list[list.length] = entity;
            if (grid) grid.add(entity);
        };`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 4).');
} else {
    console.log('Search block push 4 not found.');
}
