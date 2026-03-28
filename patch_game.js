const fs = require('fs');
const path = 'd:/New-Empires/js/core/Game.js';
let content = fs.readFileSync(path, 'utf8');

console.log('Patching Game.js...');

// 1. updateBuildMenuState - Dynamic icons and names
const buildMenuTarget = /const type = option\.dataset\.building;\s+const cost = CONFIG\.COSTS\[type\];/;
const buildMenuReplacement = `const type = option.dataset.building;

            // Resolve civilization specific building data
            if (typeof civilizationManager !== 'undefined' && civilizationManager) {
                const override = civilizationManager.getBuildingOverride(type, this.civilizationId);
                if (override) {
                    const nameEl = option.querySelector('.build-name');
                    if (nameEl && override.name) nameEl.textContent = override.name;

                    const infoEl = option.querySelector('.build-info');
                    if (infoEl && override.description) infoEl.textContent = override.description;

                    const imgEl = option.querySelector('.build-icon img');
                    if (imgEl && override.icon && typeof assetLoader !== 'undefined') {
                        const fullPath = assetLoader.getIconPath(override.icon);
                        if (!imgEl.src.includes(fullPath)) imgEl.src = fullPath;
                    }
                }
            }

            const cost = CONFIG.COSTS[type];`;

if (buildMenuTarget.test(content)) {
    content = content.replace(buildMenuTarget, buildMenuReplacement);
    console.log('- updateBuildMenuState patched');
} else {
    console.warn('- updateBuildMenuState target not found');
}

// 2. drawBuildGhost - Correct icon
const ghostTarget = /const img = assetLoader\.getImage\(this\.buildMode\);/;
const ghostReplacement = 'const img = assetLoader.getImage(civilizationManager.getBuildingIcon(this.buildMode, this.civilizationId));';

if (ghostTarget.test(content)) {
    content = content.replace(ghostTarget, ghostReplacement);
    console.log('- drawBuildGhost patched');
} else {
    console.warn('- drawBuildGhost target not found');
}

// 3. updateActionsPanel - Dynamic production menu
const actionsTarget = /\} else if \(entity\.type === 'townCenter'\)[\s\S]*?\} else if \(entity\.type === 'barracks'\)[\s\S]*?\}\s*\} else if \(entity\.type === 'house'\)/;
const actionsReplacement = `} else if (entity.trainableUnits && entity.trainableUnits.length > 0) {
            // Palette: Dinamic production buttons based on building capabilities
            const unitsForCiv = (typeof dataLoader !== 'undefined' && dataLoader.isLoaded()) 
                ? dataLoader.getUnitsForCivilization(this.civilizationId) 
                : [];

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
                const iconKey = civilizationManager ? civilizationManager.getUnitIcon(unitType, this.civilizationId) : unitType;
                const name = unitData.name || (unitType === 'villager' ? 'Aldeano' : unitType === 'warrior' ? 'Guerrero' : unitType);
                const desc = unitData.description || 'Unidad militar o de trabajo de la civilización.';

                buttons.push({
                    iconKey: iconKey,
                    iconFallback: unitType === 'villager' ? '👨‍🌾' : '⚔️',
                    label: \`Convocar \${name}\`,
                    description: desc,
                    hotkey: hotkeys[buttons.length] || 'Q',
                    cost: cost,
                    action: () => this.trainUnit(unitType, this.selectedEntities[0]),
                    enabled: enabled,
                    error: error
                });
            }
        } else if (entity.type === 'house')`;

if (actionsTarget.test(content)) {
    content = content.replace(actionsTarget, actionsReplacement);
    console.log('- updateActionsPanel patched');
} else {
    console.warn('- updateActionsPanel target not found');
}

fs.writeFileSync(path, content);
console.log('Game.js updated successfully.');
