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
        if (!civ) return;

        const bonuses = civ.bonuses;
        if (bonuses && bonuses.buildingHp) {
            building.maxHp = Math.floor(building.maxHp * bonuses.buildingHp);
        }
        building.hp = building.isUnderConstruction ? 1 : building.maxHp;

        if (civ.buildingOverrides && civ.buildingOverrides[building.type]) {
            const override = civ.buildingOverrides[building.type];
            if (override.name) building.name = override.name;
            if (override.icon) building.icon = override.icon;
        }
    }

    applyUnitBonuses(unit, civId) {
        const civ = this.getCivilization(civId);
        if (!civ) return;

        const bonuses = civ.bonuses;

        if (bonuses) {
            if (bonuses.unitSpeed) {
                unit.speed = (unit.speed || 50) * bonuses.unitSpeed;
            }
            if (bonuses.unitAttack) {
                unit.attackDamage = Math.floor(unit.attackDamage * bonuses.unitAttack);
            }
            if (bonuses.gatherSpeed && unit.canGather) {
                unit.gatherMultiplier = bonuses.gatherSpeed;
            }

            const unitBaseClass = unit.baseType || unit.type;

            if (unitBaseClass === 'warrior' || unitBaseClass === 'spearman') {
                const infAttack = bonuses.infantryAttack || bonuses.infantryDamage || 1;
                unit.attackDamage = Math.round(unit.attackDamage * infAttack);

                const infArmor = bonuses.infantryArmor || 1;
                unit.maxHp = Math.round(unit.maxHp * infArmor);
                unit.hp = unit.maxHp;
            }

            if (unitBaseClass === 'cavalry' || unitBaseClass === 'scout') {
                if (bonuses.cavalryAttack) {
                    unit.attackDamage = Math.round(unit.attackDamage * bonuses.cavalryAttack);
                }
                if (bonuses.cavalrySpeed) {
                    unit.speed = Math.round(unit.speed * bonuses.cavalrySpeed);
                }
            }

            if (unit.canGather) {
                if (bonuses.gatherGold || bonuses.goldGather) {
                    unit.gatherGoldMultiplier = bonuses.gatherGold || bonuses.goldGather;
                }
                if (bonuses.agricultureBonus || bonuses.gatherFood) {
                    unit.gatherFoodMultiplier = bonuses.agricultureBonus || bonuses.gatherFood;
                }
                if (bonuses.gatherWood || bonuses.woodGather) {
                    unit.gatherWoodMultiplier = bonuses.gatherWood || bonuses.woodGather;
                }
                if (bonuses.gatherStone || bonuses.stoneGather) {
                    unit.gatherStoneMultiplier = bonuses.gatherStone || bonuses.stoneGather;
                }
            }
        }

        if (civ.unitOverrides && civ.unitOverrides[unit.type]) {
            const override = civ.unitOverrides[unit.type];
            if (override.name) unit.name = override.name;
            if (override.icon) unit.icon = override.icon;
            if (override.attack !== undefined) unit.attackDamage = override.attack;
            if (override.hp !== undefined) {
                unit.maxHp = override.hp;
                unit.hp = override.hp;
            }
            if (override.speed !== undefined) unit.speed = override.speed;
            if (override.gatherBonus && unit.canGather) {
                unit.gatherMultiplier = (unit.gatherMultiplier || 1) * override.gatherBonus;
            }
        }
    }
}

export const civilizationManager = new CivilizationManager();
