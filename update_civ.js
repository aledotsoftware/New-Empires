const fs = require('fs');
const file = 'js/managers/CivilizationManager.js';
let content = fs.readFileSync(file, 'utf8');

const search = `        // Redireccionar unidades entrenables si la civilización tiene unidades únicas que reemplazan a las base
        if (civ.uniqueUnit && civ.uniqueUnit.baseUnit) {
            const base = civ.uniqueUnit.baseUnit;
            const unique = civ.uniqueUnit.id;
            if (building.trainableUnits && building.trainableUnits.includes(base)) {
                // Reemplazar base con unidad única
                building.trainableUnits = building.trainableUnits.map(u => u === base ? unique : u);
            }
        }`;

const replace = `        // Redireccionar unidades entrenables si la civilización tiene unidades únicas que reemplazan a las base
        if (civ.uniqueUnit && civ.uniqueUnit.baseUnit) {
            const base = civ.uniqueUnit.baseUnit;
            const unique = civ.uniqueUnit.id;
            if (building.trainableUnits && building.trainableUnits.includes(base)) {
                // BOLT OPTIMIZATION: Replace .map with in-place loop
                const len = building.trainableUnits.length;
                for (let i = 0; i < len; i++) {
                    if (building.trainableUnits[i] === base) {
                        building.trainableUnits[i] = unique;
                    }
                }
            }
        }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('CivilizationManager.js updated successfully.');
} else {
    console.log('Search block not found.');
}
