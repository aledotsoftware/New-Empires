const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    applyProceduralResources(generatedMap) {
        this.resourceNodes = [];

        for (let res of generatedMap.resources) {
            this.resourceNodes.push({
                x: res.x * TILE_SIZE,
                y: res.y * TILE_SIZE,
                type: res.type,
                amount: res.amount,
                radius: 20,
                playerId: res.playerId || null,
                // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                // res.x and res.y are already grid coordinates from mapGenerator
                _gridCol: res.x,
                _gridRow: res.y
            });
        }`;

const replace = `    applyProceduralResources(generatedMap) {
        const len = generatedMap.resources.length;
        this.resourceNodes = new Array(len);

        for (let i = 0; i < len; i++) {
            const res = generatedMap.resources[i];
            this.resourceNodes[i] = {
                x: res.x * TILE_SIZE,
                y: res.y * TILE_SIZE,
                type: res.type,
                amount: res.amount,
                radius: 20,
                playerId: res.playerId || null,
                // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                // res.x and res.y are already grid coordinates from mapGenerator
                _gridCol: res.x,
                _gridRow: res.y
            };
        }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 5).');
} else {
    console.log('Search block push 5 not found.');
}

const search2 = `                        this.resourceNodes.push({
                            x: rx,
                            y: ry,
                            type: res.type,
                            amount: res.amount,
                            radius: 20,
                            // BOLT OPTIMIZATION: Pre-calculate grid coords
                            _gridCol: (rx / TILE_SIZE) | 0,
                            _gridRow: (ry / TILE_SIZE) | 0
                        });`;

const replace2 = `                        this.resourceNodes[this.resourceNodes.length] = {
                            x: rx,
                            y: ry,
                            type: res.type,
                            amount: res.amount,
                            radius: 20,
                            // BOLT OPTIMIZATION: Pre-calculate grid coords
                            _gridCol: (rx / TILE_SIZE) | 0,
                            _gridRow: (ry / TILE_SIZE) | 0
                        };`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 6).');
} else {
    console.log('Search block push 6 not found.');
}
