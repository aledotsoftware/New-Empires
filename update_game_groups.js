const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `        // Grupos de control (Ctrl+1-9 para guardar, 1-9 para seleccionar)
        this.controlGroups = [];
        for (let i = 0; i < 10; i++) {
            this.controlGroups.push([]);
        }`;

const replace = `        // Grupos de control (Ctrl+1-9 para guardar, 1-9 para seleccionar)
        this.controlGroups = new Array(10);
        for (let i = 0; i < 10; i++) {
            this.controlGroups[i] = [];
        }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (groups).');
} else {
    console.log('Search block groups not found.');
}
