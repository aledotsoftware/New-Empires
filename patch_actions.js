const fs = require('fs');
const path = 'd:/New-Empires/js/core/Game.js';
let content = fs.readFileSync(path, 'utf8');

console.log('Patching updateActionsPanel in Game.js...');

// Regex to find the townCenter and barracks blocks
const target = /\s+\} else if \(entity\.type === 'townCenter'\) \{(?:[\s\S]*?)\s+\} else if \(entity\.type === 'barracks'\) \{(?:[\s\S]*?)\s+\}/;

const replacement = `
        } else if (entity.trainableUnits && entity.trainableUnits.length > 0) {
            // BOLT OPTIMIZATION: Dynamic production buttons
            const unitsForCiv = (typeof dataLoader !== 'undefined' && dataLoader.isLoaded()) 
                ? dataLoader.getUnitsForCivilization(this.civilizationId) 
                : [];

            const hotkeys = ['Q', 'W', 'E', 'R', 'T', 'Y'];

            for (let i = 0; i < entity.trainableUnits.length; i++) {
                const unitType = entity.trainableUnits[i];
                const unitData = unitsForCiv.find(u => u.id === unitType) || {};
                
                const cost = CONFIG.UNIT_COSTS[unitType] || CONFIG.UNIT_COSTS.villager;
                const canAfford = this.canAfford(cost);
                const enabled = canAfford && !popFull;
                
                let error = null;
                if (!canAfford) error = 'Recursos insuficientes';
                else if (popFull) error = 'Límite de población alcanzado';

                // Resolve icon and text
                const iconKey = (typeof civilizationManager !== 'undefined' && civilizationManager) 
                    ? civilizationManager.getUnitIcon(unitType, this.civilizationId) 
                    : unitType;
                
                const name = unitData.name || (unitType === 'villager' ? 'Aldeano' : unitType === 'warrior' ? 'Guerrero' : unitType);
                const desc = unitData.description || 'Unidad de la civilización.';

                buttons.push({
                    iconKey: iconKey,
                    iconFallback: unitType === 'villager' ? '👨\u200d🌾' : '⚔️',
                    label: \`Convocar \${name}\`,
                    description: desc,
                    hotkey: hotkeys[i] || 'Q',
                    cost: cost,
                    action: () => this.trainUnit(unitType, this.selectedEntities[0]),
                    enabled: enabled,
                    error: error
                });
            }
        }`;

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully patched updateActionsPanel.');
} else {
    console.error('FAILED: Target block not found in Game.js');
    // Try a more flexible regex
    const flexibleTarget = /\} else if \(entity\.type === 'townCenter'\)[\s\S]*?\} else if \(entity\.type === 'barracks'\)[\s\S]*?\}\s*(?=\/\/ Añadir tecnologías)/;
    if (flexibleTarget.test(content)) {
         content = content.replace(flexibleTarget, replacement);
         fs.writeFileSync(path, content);
         console.log('Successfully patched updateActionsPanel (flexible).');
    } else {
         console.warn('Regex debug:');
         console.warn('townCenter exists:', /entity\.type === 'townCenter'/.test(content));
         console.warn('barracks exists:', /entity\.type === 'barracks'/.test(content));
    }
}
