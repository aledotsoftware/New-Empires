const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `            this._cacheEntityTerrain(unit); // OPTIMIZATION
            this.units.push(unit);`;

const replace = `            this._cacheEntityTerrain(unit); // OPTIMIZATION
            this.units[this.units.length] = unit;`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (push 10).');
} else {
    console.log('Search block push 10 not found.');
}
