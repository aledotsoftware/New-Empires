const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `            if (distSqPlayer > 40000 && distSqEnemy > 40000) {
                this.resourceNodes.push({
                    x, y,
                    type: resType.type,
                    amount: resType.amount,
                    radius: 20,
                    // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                    _gridCol: (x / TILE_SIZE) | 0,
                    _gridRow: (y / TILE_SIZE) | 0
                });
            } else {`;

const replace = `            if (distSqPlayer > 40000 && distSqEnemy > 40000) {
                this.resourceNodes[this.resourceNodes.length] = {
                    x, y,
                    type: resType.type,
                    amount: resType.amount,
                    radius: 20,
                    // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                    _gridCol: (x / TILE_SIZE) | 0,
                    _gridRow: (y / TILE_SIZE) | 0
                };
            } else {`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 7).');
} else {
    console.log('Search block push 7 not found.');
}
