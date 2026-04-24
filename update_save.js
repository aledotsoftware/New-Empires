const fs = require('fs');
const file = 'js/managers/SaveManager.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    _serializeGameState(game) {
        const serializedUnits = [];
        for (let i = 0; i < game.units.length; i++) {
            serializedUnits.push(this._serializeEntity(game.units[i]));
        }

        const serializedBuildings = [];
        for (let i = 0; i < game.buildings.length; i++) {
            serializedBuildings.push(this._serializeEntity(game.buildings[i]));
        }

        const serializedEnemies = [];
        for (let i = 0; i < game.enemies.length; i++) {
            serializedEnemies.push(this._serializeEntity(game.enemies[i]));
        }

        const serializedResourceNodes = [];
        for (let i = 0; i < game.resourceNodes.length; i++) {
            const r = game.resourceNodes[i];
            serializedResourceNodes.push({
                x: r.x,
                y: r.y,
                type: r.type,
                amount: r.amount
            });
        }`;

const replace = `    _serializeGameState(game) {
        const unitsLen = game.units.length;
        const serializedUnits = new Array(unitsLen);
        for (let i = 0; i < unitsLen; i++) {
            serializedUnits[i] = this._serializeEntity(game.units[i]);
        }

        const buildLen = game.buildings.length;
        const serializedBuildings = new Array(buildLen);
        for (let i = 0; i < buildLen; i++) {
            serializedBuildings[i] = this._serializeEntity(game.buildings[i]);
        }

        const enemyLen = game.enemies.length;
        const serializedEnemies = new Array(enemyLen);
        for (let i = 0; i < enemyLen; i++) {
            serializedEnemies[i] = this._serializeEntity(game.enemies[i]);
        }

        const nodeLen = game.resourceNodes.length;
        const serializedResourceNodes = new Array(nodeLen);
        for (let i = 0; i < nodeLen; i++) {
            const r = game.resourceNodes[i];
            serializedResourceNodes[i] = {
                x: r.x,
                y: r.y,
                type: r.type,
                amount: r.amount
            };
        }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('SaveManager.js updated successfully.');
} else {
    console.log('Search block not found.');
}
