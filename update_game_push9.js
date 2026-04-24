const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `        // Crear Centro Urbano inicial (jugador)
        const townCenter = new TownCenter(startX, startY, 'player'); if (typeof civilizationManager !== 'undefined') civilizationManager.applyBuildingBonuses(townCenter, this.civilizationId);
        this._cacheEntityTerrain(townCenter); // OPTIMIZATION
        this.buildings[this.buildings.length] = townCenter;
        this.dropOffPoints[this.dropOffPoints.length] = townCenter;
        this.townCenterCounts.player++;
        this._updateBuildingCount('townCenter', 1);`;

const replace = `        // Crear Centro Urbano inicial (jugador)
        const townCenter = new TownCenter(startX, startY, 'player'); if (typeof civilizationManager !== 'undefined') civilizationManager.applyBuildingBonuses(townCenter, this.civilizationId);
        this._cacheEntityTerrain(townCenter); // OPTIMIZATION
        this.buildings[this.buildings.length] = townCenter;
        this.dropOffPoints[this.dropOffPoints.length] = townCenter;
        this.townCenterCounts.player++;
        this._updateBuildingCount('townCenter', 1);`;

// The ones that are left are in the create resources code or in UI which are fine and small loops.
// I will not touch them.
console.log('Push removal mostly complete.');
