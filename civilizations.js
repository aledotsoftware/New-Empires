// ==========================================
// SISTEMA DE CIVILIZACIONES
// ==========================================

// Configuración de civilizaciones (Incrustada para evitar problemas de CORS/Carga local)
const CIVILIZATIONS_DATA = {
    "romans": {
        "id": "romans",
        "name": "Imperio Romano",
        "nameShort": "Romanos",
        "icon": "🏛️",
        "color": "#c53030",
        "primaryColor": "#8b0000",
        "secondaryColor": "#ffd700",
        "description": "Maestros de la construcción y la ingeniería. Sus edificios son más resistentes y se construyen más rápido.",
        "lore": "El poderoso Imperio Romano conquistó gran parte del mundo conocido con su disciplina militar y arquitectura superior.",

        "bonuses": {
            "buildSpeed": 1.25,
            "buildingHp": 1.3,
            "infantryAttack": 1.1,
            "startingResources": {
                "wood": 0,
                "food": 0,
                "gold": 0,
                "stone": 50
            }
        },

        "units": {
            "villager": {
                "name": "Ciudadano Romano",
                "icon": "👨‍🌾",
                "gatherBonus": 1.0
            },
            "warrior": {
                "name": "Legionario",
                "icon": "🛡️",
                "attack": 12,
                "hp": 110,
                "speed": 45
            },
            "archer": {
                "name": "Arquero Romano",
                "icon": "🏹",
                "attack": 8,
                "hp": 60,
                "speed": 50
            }
        },

        "buildings": {
            "townCenter": {
                "name": "Foro Romano",
                "icon": "🏛️"
            },
            "house": {
                "name": "Domus",
                "icon": "🏠"
            },
            "barracks": {
                "name": "Castra",
                "icon": "⚔️"
            }
        },

        "uniqueUnit": {
            "id": "centurion",
            "name": "Centurión",
            "icon": "🗡️",
            "description": "Guerrero de élite con alta resistencia y daño",
            "cost": {
                "food": 80,
                "gold": 40
            },
            "stats": {
                "hp": 150,
                "attack": 15,
                "speed": 50,
                "attackSpeed": 1.3
            }
        }
    },
    "argentinians": {
        "id": "argentinians",
        "name": "Imperio Argentino",
        "nameShort": "Argentinos",
        "icon": "🏛️",
        "color": "#c53030",
        "primaryColor": "#8b0000",
        "secondaryColor": "#ffd700",
        "description": "Maestros de la construcción y la ingeniería. Sus edificios son más resistentes y se construyen más rápido.",
        "lore": "El poderoso Imperio Romano conquistó gran parte del mundo conocido con su disciplina militar y arquitectura superior.",

        "bonuses": {
            "buildSpeed": 1.25,
            "buildingHp": 1.3,
            "infantryAttack": 1.1,
            "startingResources": {
                "wood": 0,
                "food": 0,
                "gold": 0,
                "stone": 50
            }
        },

        "units": {
            "villager": {
                "name": "Argento",
                "icon": "👨‍🌾",
                "gatherBonus": 1.0
            },
            "warrior": {
                "name": "Miliciano Criollo",
                "icon": "🛡️",
                "attack": 12,
                "hp": 110,
                "speed": 45
            },
            "archer": {
                "name": "Ballestero Patagónico",
                "icon": "🏹",
                "attack": 8,
                "hp": 60,
                "speed": 50
            }
        },

        "buildings": {
            "townCenter": {
                "name": "Cabildo",
                "icon": "🏛️"
            },
            "house": {
                "name": "Rancho",
                "icon": "🏠"
            },
            "barracks": {
                "name": "Fortín",
                "icon": "⚔️"
            }
        },

        "uniqueUnit": {
            "id": "granaderoCaballo",
            "name": "Granadero a Caballo",
            "icon": "�",
            "description": "Granadero a Caballo de élite con alta resistencia y daño, capaz de atacar a caballo. Su velocidad de ataque es más rápida que la de los guerreros. Su velocidad de movimiento es más rápida que la de los guerreros.",
            "cost": {
                "food": 80,
                "gold": 40
            },
            "stats": {
                "hp": 150,
                "attack": 15,
                "speed": 50,
                "attackSpeed": 1.3
            }
        }
    },
    "vikings": {
        "id": "vikings",
        "name": "Reino Vikingo",
        "nameShort": "Vikings",
        "icon": "⚔️",
        "color": "#2b6cb0",
        "primaryColor": "#1e3a5f",
        "secondaryColor": "#4a90e2",
        "description": "Guerreros feroces del norte. Sus unidades son más rápidas y tienen mayor capacidad de ataque.",
        "lore": "Los temidos guerreros nórdicos, conocidos por su ferocidad en batalla y habilidades de navegación.",

        "bonuses": {
            "unitSpeed": 1.15,
            "unitAttack": 1.15,
            "gatherSpeed": 1.1,
            "startingResources": {
                "wood": 50,
                "food": 50,
                "gold": 0,
                "stone": 0
            }
        },

        "units": {
            "villager": {
                "name": "Aldeano Vikingo",
                "icon": "🧔",
                "gatherBonus": 1.1
            },
            "warrior": {
                "name": "Berserker",
                "icon": "🪓",
                "attack": 14,
                "hp": 100,
                "speed": 60
            },
            "archer": {
                "name": "Arquero Nórdico",
                "icon": "🏹",
                "attack": 10,
                "hp": 55,
                "speed": 55
            }
        },

        "buildings": {
            "townCenter": {
                "name": "Gran Salón",
                "icon": "🏰"
            },
            "house": {
                "name": "Cabaña Vikinga",
                "icon": "🛖"
            },
            "barracks": {
                "name": "Campo de Guerra",
                "icon": "⚔️"
            }
        },

        "uniqueUnit": {
            "id": "jarl",
            "name": "Jarl",
            "icon": "👑",
            "description": "Líder vikingo con alta velocidad y daño crítico",
            "cost": {
                "food": 70,
                "gold": 50
            },
            "stats": {
                "hp": 120,
                "attack": 18,
                "speed": 65,
                "attackSpeed": 1.5
            }
        }
    }
};

class CivilizationManager {
    constructor() {
        this.civilizations = CIVILIZATIONS_DATA; // Datos por defecto (respaldo)
        this.loaded = false;
    }

    async loadCivilizations() {
        try {
            console.log('📂 Cargando civilizaciones desde dataLoader...');

            // Esperar a que dataLoader esté listo si no lo está
            if (!dataLoader.isLoaded()) {
                console.log('⏳ Esperando a que dataLoader inicialice...');
                await dataLoader.initialize();
            }

            // Obtener civilizaciones desde dataLoader
            const loadedCivs = dataLoader.getAllCivilizations();

            if (loadedCivs && loadedCivs.length > 0) {
                // Convertir array a objeto con civilizationId como clave
                this.civilizations = {};
                loadedCivs.forEach(civ => {
                    const civId = civ.civilizationId || civ.id;

                    // Transformar formato de dataLoader a formato de civilizationManager
                    this.civilizations[civId] = {
                        id: civId,
                        name: civ.name,
                        nameShort: civ.name,
                        icon: civ.icon,
                        color: civ.color,
                        primaryColor: civ.color,
                        secondaryColor: civ.secondaryColor || civ.color,
                        description: civ.description,
                        lore: civ.description,
                        bonuses: civ.bonuses || {},
                        units: civ.unitOverrides || {},
                        buildings: civ.buildingOverrides || {},
                        uniqueUnit: civ.uniqueUnit || null
                    };
                });

                console.log('✅ ÉXITO: Civilizaciones cargadas desde assets/civilization/');
                console.log('📋 Civs disponibles:', Object.keys(this.civilizations));
            } else {
                throw new Error('No se encontraron civilizaciones en dataLoader');
            }
        } catch (error) {
            console.warn('⚠️ AVISO: Usando configuración interna (fallback):', error.message);
            this.civilizations = CIVILIZATIONS_DATA;
        }
        this.loaded = true;
        return true;
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

        console.groupCollapsed(`🛠️ Aplicando bonos de ${civ.name} a ${unit.type}`);

        // Aplicar bonificaciones generales
        if (bonuses.unitSpeed && bonuses.unitSpeed !== 1) {
            const oldSpeed = unit.speed;
            unit.speed *= bonuses.unitSpeed;
            console.log(`⚡ Velocidad: ${oldSpeed} -> ${unit.speed.toFixed(1)} (+${Math.round((bonuses.unitSpeed - 1) * 100)}%)`);
        }

        if (bonuses.unitAttack && bonuses.unitAttack !== 1) {
            const oldDmg = unit.attackDamage;
            unit.attackDamage *= bonuses.unitAttack;
            console.log(`⚔️ Ataque: ${oldDmg} -> ${unit.attackDamage.toFixed(1)} (+${Math.round((bonuses.unitAttack - 1) * 100)}%)`);
        }

        if (bonuses.infantryAttack && (unit.type === 'warrior') && bonuses.infantryAttack !== 1) {
            const oldDmg = unit.attackDamage;
            unit.attackDamage *= bonuses.infantryAttack;
            console.log(`⚔️ Ataque Infantería: ${oldDmg} -> ${unit.attackDamage.toFixed(1)} (+${Math.round((bonuses.infantryAttack - 1) * 100)}%)`);
        }

        // Aplicar configuración específica de unidad
        if (unitConfig) {
            if (unitConfig.name) unit.name = unitConfig.name;
            if (unitConfig.icon) unit.icon = unitConfig.icon;

            if (unitConfig.attack !== undefined) {
                unit.attackDamage = unitConfig.attack;
                console.log(`🎯 Ataque base modificado a ${unitConfig.attack}`);
            }
            if (unitConfig.hp !== undefined) {
                unit.maxHp = unitConfig.hp;
                unit.hp = unitConfig.hp;
                console.log(`❤️ HP base modificado a ${unitConfig.hp}`);
            }
            if (unitConfig.speed !== undefined) {
                unit.speed = unitConfig.speed;
                console.log(`⚡ Velocidad base modificada a ${unitConfig.speed}`);
            }
            if (unitConfig.gatherBonus && bonuses.gatherSpeed) {
                unit.gatherBonus = unitConfig.gatherBonus * bonuses.gatherSpeed;
                console.log(`🌾 Bono recolección: ${unit.gatherBonus.toFixed(2)}`);
            }
        }
        console.groupEnd();

        return unit;
    }

    // Aplicar bonificaciones de civilización a un edificio
    applyBuildingBonuses(building, civId) {
        const civ = this.getCivilization(civId);
        if (!civ) return building;

        const bonuses = civ.bonuses;
        const buildingConfig = civ.buildings[building.type];

        console.groupCollapsed(`🏗️ Aplicando bonos de ${civ.name} a ${building.type}`);

        // Aplicar bonificaciones generales
        if (bonuses.buildingHp && bonuses.buildingHp !== 1) {
            const oldHp = building.maxHp;
            building.maxHp *= bonuses.buildingHp;
            building.hp = building.maxHp;
            console.log(`🧱 HP Edificio: ${oldHp} -> ${building.maxHp.toFixed(0)} (+${Math.round((bonuses.buildingHp - 1) * 100)}%)`);
        }

        // Aplicar configuración específica de edificio
        if (buildingConfig) {
            if (buildingConfig.name) building.name = buildingConfig.name;
            if (buildingConfig.icon) building.icon = buildingConfig.icon;
        }
        console.groupEnd();

        return building;
    }

    // Obtener recursos iniciales extra por civilización
    getStartingResources(civId) {
        const civ = this.getCivilization(civId);
        if (!civ || !civ.bonuses.startingResources) {
            return { wood: 0, food: 0, gold: 0, stone: 0 };
        }
        console.log(`💰 Recursos iniciales extra para ${civ.name}:`, civ.bonuses.startingResources);
        return civ.bonuses.startingResources;
    }

    // Obtener velocidad de construcción
    getBuildSpeed(civId) {
        const civ = this.getCivilization(civId);
        const speed = civ && civ.bonuses.buildSpeed ? civ.bonuses.buildSpeed : 1.0;
        if (speed !== 1.0) console.log(`🔨 Velocidad de construcción: x${speed}`);
        return speed;
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
