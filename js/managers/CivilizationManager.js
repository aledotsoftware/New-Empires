import { dataLoader } from './DataLoader.js';
/**
 * CivilizationManager - Gestor de civilizaciones
 * Proporciona acceso a datos de civilización y aplica bonificaciones
 */

export class CivilizationManager {
    getAllCivilizations() {
        return dataLoader.getAllCivilizations();
    }

    getCivilization(id) {
        return dataLoader.getCivilizationData(id);
    }

    getStartingResources(id) {
        const civ = this.getCivilization(id);
        return civ?.bonuses?.startingResources || {};
    }

    getBuildSpeed(id) {
        const civ = this.getCivilization(id);
        return civ?.bonuses?.buildSpeed || 1;
    }

    getTeamColor(civId, team) {
        const civ = this.getCivilization(civId);

        // Si la civilización tiene un color definido, usarlo para el equipo del jugador
        if (civ && civ.color && team === 'player') {
            // Convertir hex a rgba con transparencia
            const hex = civ.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, 0.3)`;
        }

        // Colores por defecto para cada equipo
        switch (team) {
            case 'player': return 'rgba(72, 187, 120, 0.3)'; // Verde
            case 'enemy': return 'rgba(197, 48, 48, 0.3)';   // Rojo
            default: return 'rgba(160, 160, 160, 0.3)';      // Gris
        }
    }

    applyBuildingBonuses(building, civId) {
        const civ = this.getCivilization(civId);
        if (!civ || !civ.bonuses) return;

        if (civ.bonuses.buildingHp) {
            building.maxHp = Math.floor(building.maxHp * civ.bonuses.buildingHp);
        }
        building.hp = building.isUnderConstruction ? 1 : building.maxHp;
    }

    applyUnitBonuses(unit, civId) {
        const civ = this.getCivilization(civId);
        if (!civ || !civ.bonuses) return;

        if (civ.bonuses.unitSpeed) {
            unit.speed = (unit.speed || 50) * civ.bonuses.unitSpeed;
        }
        if (civ.bonuses.unitAttack) {
            unit.attackDamage = Math.floor(unit.attackDamage * civ.bonuses.unitAttack);
        }
        if (civ.bonuses.gatherSpeed && unit.canGather) {
            unit.gatherMultiplier = civ.bonuses.gatherSpeed;
        }
    }
}

export const civilizationManager = new CivilizationManager();
