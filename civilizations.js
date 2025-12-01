// ==========================================
// SISTEMA DE CIVILIZACIONES
// ==========================================

class CivilizationManager {
    constructor() {
        this.civilizations = {};
        this.loaded = false;
    }

    async loadCivilizations() {
        try {
            const response = await fetch('civilizations.json');
            const data = await response.json();
            this.civilizations = data.civilizations;
            this.loaded = true;
            console.log('✅ Civilizaciones cargadas:', Object.keys(this.civilizations));
            return true;
        } catch (error) {
            console.error('❌ Error cargando civilizaciones:', error);
            return false;
        }
    }

    getCivilization(civId) {
        return this.civilizations[civId] || null;
    }

    getAllCivilizations() {
        return Object.values(this.civilizations);
    }

    getCivilizationIds() {
        return Object.keys(this.civilizations);
    }

    // Aplicar bonificaciones de civilización a una unidad
    applyUnitBonuses(unit, civId) {
        const civ = this.getCivilization(civId);
        if (!civ) return unit;

        const bonuses = civ.bonuses;
        const unitConfig = civ.units[unit.type];

        // Aplicar bonificaciones generales
        if (bonuses.unitSpeed) {
            unit.speed *= bonuses.unitSpeed;
        }

        if (bonuses.unitAttack) {
            unit.attackDamage *= bonuses.unitAttack;
        }

        if (bonuses.infantryAttack && (unit.type === 'warrior')) {
            unit.attackDamage *= bonuses.infantryAttack;
        }

        // Aplicar configuración específica de unidad
        if (unitConfig) {
            unit.name = unitConfig.name || unit.name;
            unit.icon = unitConfig.icon || unit.icon;

            if (unitConfig.attack !== undefined) {
                unit.attackDamage = unitConfig.attack;
            }
            if (unitConfig.hp !== undefined) {
                unit.maxHp = unitConfig.hp;
                unit.hp = unitConfig.hp;
            }
            if (unitConfig.speed !== undefined) {
                unit.speed = unitConfig.speed;
            }
            if (unitConfig.gatherBonus && bonuses.gatherSpeed) {
                unit.gatherBonus = unitConfig.gatherBonus * bonuses.gatherSpeed;
            }
        }

        return unit;
    }

    // Aplicar bonificaciones de civilización a un edificio
    applyBuildingBonuses(building, civId) {
        const civ = this.getCivilization(civId);
        if (!civ) return building;

        const bonuses = civ.bonuses;
        const buildingConfig = civ.buildings[building.type];

        // Aplicar bonificaciones generales
        if (bonuses.buildingHp) {
            building.maxHp *= bonuses.buildingHp;
            building.hp = building.maxHp;
        }

        // Aplicar configuración específica de edificio
        if (buildingConfig) {
            building.name = buildingConfig.name || building.name;
            building.icon = buildingConfig.icon || building.icon;
        }

        return building;
    }

    // Obtener recursos iniciales extra por civilización
    getStartingResources(civId) {
        const civ = this.getCivilization(civId);
        if (!civ || !civ.bonuses.startingResources) {
            return { wood: 0, food: 0, gold: 0, stone: 0 };
        }
        return civ.bonuses.startingResources;
    }

    // Obtener velocidad de construcción
    getBuildSpeed(civId) {
        const civ = this.getCivilization(civId);
        return civ && civ.bonuses.buildSpeed ? civ.bonuses.buildSpeed : 1.0;
    }

    // Obtener color de equipo para civilización
    getTeamColor(civId, team) {
        const civ = this.getCivilization(civId);
        if (!civ) {
            return team === 'player' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(197, 48, 48, 0.3)';
        }

        // Usar color primario de la civilización con transparencia
        const color = civ.primaryColor;
        // Convertir hex a rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }
}

// Instancia global del gestor de civilizaciones
const civilizationManager = new CivilizationManager();
