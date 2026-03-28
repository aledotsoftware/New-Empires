const fs = require('fs');

// 1. Fix Game.js
const gamePath = 'd:/New-Empires/js/core/Game.js';
if (fs.existsSync(gamePath)) {
    let gameContent = fs.readFileSync(gamePath, 'utf8');
    console.log('Patching Game.js...');

    // Restore updateActionsPanel buttons logic
    const corruptTarget = /if \(entity\.type === 'villager'\) \{\s+buttons\.push\(\{[\s\S]*?\}\);\s+\}\s+\}/;
    const correctReplacement = `if (entity.type === 'villager') {
            buttons.push({
                iconKey: 'workshop',
                iconFallback: '🏗️',
                label: 'Erigir Estructura',
                description: 'Diseñar los cimientos de la civilización',
                hotkey: 'Q',
                action: () => this.openBuildMenu(),
                enabled: true
            });
        } else if (entity.trainableUnits && entity.trainableUnits.length > 0) {
            // BOLT OPTIMIZATION: Dynamic production buttons
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

    if (corruptTarget.test(gameContent)) {
        gameContent = gameContent.replace(corruptTarget, correctReplacement);
        fs.writeFileSync(gamePath, gameContent);
        console.log('- Game.js production menu fixed');
    } else {
        console.warn('- Game.js production menu target not found');
    }
}

// 2. Fix server.js Permissions-Policy
const serverPath = 'd:/New-Empires/server.js';
if (fs.existsSync(serverPath)) {
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    console.log('Patching server.js...');

    const policyTarget = /'Permissions-Policy': 'geolocation=\(\), microphone=\(\), camera=\(\), payment=\(\), usb=\(\), vr=\(\)'/;
    const policyReplacement = "'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), xr-spatial-tracking=()'";

    if (policyTarget.test(serverContent)) {
        serverContent = serverContent.replace(policyTarget, policyReplacement);
        fs.writeFileSync(serverPath, serverContent);
        console.log('- server.js Permissions-Policy fixed');
    } else {
        console.warn('- server.js Permissions-Policy target not found');
    }
}

// 3. Fix index.html missing icons
const indexPath = 'd:/New-Empires/index.html';
if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    console.log('Patching index.html...');

    // Remove <img> tags for missing save/load/export icons
    indexContent = indexContent.replace(/<img src="assets\/icons\/save\.png"[\s\S]*?>/g, '💾');
    indexContent = indexContent.replace(/<img src="assets\/icons\/load\.png"[\s\S]*?>/g, '📂');
    indexContent = indexContent.replace(/<img src="assets\/icons\/export\.png"[\s\S]*?>/g, '📤');

    fs.writeFileSync(indexPath, indexContent);
    console.log('- index.html icons replaced with emojis');
}

console.log('Cleanup complete.');
