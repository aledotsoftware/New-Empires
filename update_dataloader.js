const fs = require('fs');
const file = 'js/managers/DataLoader.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    createUniqueUnit(uniqueUnitData) {
        const baseUnit = this.baseData.units.find(u => u.id === uniqueUnitData.baseUnit);
        if (!baseUnit) {`;

const replace = `    createUniqueUnit(uniqueUnitData) {
        // BOLT OPTIMIZATION: Replace .find with loop
        let baseUnit = null;
        const len = this.baseData.units.length;
        for (let i = 0; i < len; i++) {
            if (this.baseData.units[i].id === uniqueUnitData.baseUnit) {
                baseUnit = this.baseData.units[i];
                break;
            }
        }

        if (!baseUnit) {`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('DataLoader.js updated successfully.');
} else {
    console.log('Search block not found.');
}
