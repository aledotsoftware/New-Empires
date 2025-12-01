// ============= EDADES HISTÓRICAS =============
// 30 períodos de 500 años desde 13.000-12.500 a.C. hasta 1500-2000 d.C.

const AGES = {
    1: { id: 1, name: 'Paleolítico Superior Inicial', period: '13.000-12.500 a.C.', era: 'Prehistoria' },
    2: { id: 2, name: 'Paleolítico Superior Final', period: '12.500-12.000 a.C.', era: 'Prehistoria' },
    3: { id: 3, name: 'Mesolítico Temprano', period: '12.000-11.500 a.C.', era: 'Prehistoria' },
    4: { id: 4, name: 'Mesolítico', period: '11.500-11.000 a.C.', era: 'Prehistoria' },
    5: { id: 5, name: 'Revolución Neolítica Inicial', period: '11.000-10.500 a.C.', era: 'Prehistoria' },
    6: { id: 6, name: 'Neolítico Temprano', period: '10.500-10.000 a.C.', era: 'Prehistoria' },
    7: { id: 7, name: 'Neolítico Medio', period: '10.000-9.500 a.C.', era: 'Prehistoria' },
    8: { id: 8, name: 'Neolítico Avanzado', period: '9.500-9.000 a.C.', era: 'Prehistoria' },
    9: { id: 9, name: 'Primeras Aldeas', period: '9.000-8.500 a.C.', era: 'Prehistoria' },
    10: { id: 10, name: 'Proto-Civilización', period: '8.500-8.000 a.C.', era: 'Prehistoria' },
    11: { id: 11, name: 'Edad del Cobre Inicial', period: '8.000-7.500 a.C.', era: 'Prehistoria' },
    12: { id: 12, name: 'Edad del Cobre', period: '7.500-7.000 a.C.', era: 'Prehistoria' },
    13: { id: 13, name: 'Calcolítico', period: '7.000-6.500 a.C.', era: 'Prehistoria' },
    14: { id: 14, name: 'Primeras Ciudades', period: '6.500-6.000 a.C.', era: 'Prehistoria' },
    15: { id: 15, name: 'Proto-Escritura', period: '6.000-5.500 a.C.', era: 'Prehistoria' },
    16: { id: 16, name: 'Edad del Bronce Inicial', period: '5.500-5.000 a.C.', era: 'Edad del Bronce' },
    17: { id: 17, name: 'Bronce Temprano', period: '5.000-4.500 a.C.', era: 'Edad del Bronce' },
    18: { id: 18, name: 'Bronce Medio I', period: '4.500-4.000 a.C.', era: 'Edad del Bronce' },
    19: { id: 19, name: 'Bronce Medio II', period: '4.000-3.500 a.C.', era: 'Edad del Bronce' },
    20: { id: 20, name: 'Bronce Tardío', period: '3.500-3.000 a.C.', era: 'Edad del Bronce' },
    21: { id: 21, name: 'Grandes Imperios del Bronce', period: '3.000-2.500 a.C.', era: 'Edad del Bronce' },
    22: { id: 22, name: 'Apogeo del Bronce', period: '2.500-2.000 a.C.', era: 'Edad del Bronce' },
    23: { id: 23, name: 'Colapso del Bronce', period: '2.000-1.500 a.C.', era: 'Edad del Bronce' },
    24: { id: 24, name: 'Edad del Hierro Inicial', period: '1.500-1.000 a.C.', era: 'Edad del Hierro' },
    25: { id: 25, name: 'Hierro I', period: '1.000-500 a.C.', era: 'Edad del Hierro' },
    26: { id: 26, name: 'Hierro II - Era Clásica', period: '500-1 a.C.', era: 'Edad Clásica' },
    27: { id: 27, name: 'Era Romana', period: '1-500 d.C.', era: 'Edad Clásica' },
    28: { id: 28, name: 'Alta Edad Media', period: '500-1000 d.C.', era: 'Edad Media' },
    29: { id: 29, name: 'Baja Edad Media', period: '1000-1500 d.C.', era: 'Edad Media' },
    30: { id: 30, name: 'Era Moderna Temprana', period: '1500-2000 d.C.', era: 'Edad Moderna' }
};

// Categorías de Tecnologías
const TECH_CATEGORIES = {
    ECONOMY: 'Economía',
    MILITARY: 'Militar',
    DEFENSE: 'Defensa',
    TOOLS: 'Herramientas',
    AGRICULTURE: 'Agricultura',
    ARCHITECTURE: 'Arquitectura',
    CULTURE: 'Cultura'
};

const TECHNOLOGIES = {
    // ========== PALEOLÍTICO SUPERIOR (13.000-12.000 a.C.) - EDADES 1-2 ==========
    flintKnapping: {
        id: 'flintKnapping',
        name: 'Talla de Sílex',
        icon: '🪨',
        category: TECH_CATEGORIES.TOOLS,
        age: 1,
        description: 'Arte de tallar sílex para crear herramientas cortantes.',
        cost: { food: 25 },
        researchTime: 5,
        building: 'townCenter',
        prerequisites: [],
        apply: (game) => {
            CONFIG.GATHER_RATES.wood *= 1.1;
        }
    },

    caveArt: {
        id: 'caveArt',
        name: 'Arte Rupestre',
        icon: '🎨',
        category: TECH_CATEGORIES.CULTURE,
        age: 2,
        description: 'Primeras expresiones artísticas humanas.',
        cost: { food: 30 },
        researchTime: 8,
        building: 'townCenter',
        prerequisites: ['flintKnapping'],
        apply: (game) => {
            // Bonus cultural
        }
    },

    // ========== MESOLÍTICO (12.000-11.000 a.C.) - EDADES 3-4 ==========
    huntingBow: {
        id: 'huntingBow',
        name: 'Arco de Caza',
        icon: '🏹',
        category: TECH_CATEGORIES.MILITARY,
        age: 3,
        description: 'Invención del arco para caza y guerra.',
        cost: { food: 40, wood: 20 },
        researchTime: 10,
        building: 'barracks',
        prerequisites: [],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.attackRange += 1;
                }
            });
        }
    },

    microliths: {
        id: 'microliths',
        name: 'Microlitos',
        icon: '🔪',
        category: TECH_CATEGORIES.TOOLS,
        age: 4,
        description: 'Pequeñas herramientas de piedra muy afiladas.',
        cost: { food: 50 },
        researchTime: 10,
        building: 'townCenter',
        prerequisites: ['flintKnapping'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.15;
        }
    },

    // ========== REVOLUCIÓN NEOLÍTICA (11.000-9.000 a.C.) - EDADES 5-8 ==========
    domestication: {
        id: 'domestication',
        name: 'Domesticación Animal',
        icon: '🐑',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 5,
        description: 'Domesticación de los primeros animales.',
        cost: { food: 75 },
        researchTime: 15,
        building: 'townCenter',
        prerequisites: [],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.25;
        }
    },

    agriculture: {
        id: 'agriculture',
        name: 'Agricultura',
        icon: '🌾',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 6,
        description: 'Cultivo de las primeras plantas.',
        cost: { food: 100 },
        researchTime: 20,
        building: 'townCenter',
        prerequisites: ['domestication'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.3;
        }
    },

    pottery: {
        id: 'pottery',
        name: 'Cerámica',
        icon: '🏺',
        category: TECH_CATEGORIES.TOOLS,
        age: 7,
        description: 'Creación de recipientes de arcilla cocida.',
        cost: { food: 80, wood: 40 },
        researchTime: 15,
        building: 'storage',
        prerequisites: [],
        apply: (game) => {
            // Permite almacenar más recursos
            CONFIG.MAX_STORAGE = CONFIG.MAX_STORAGE ? CONFIG.MAX_STORAGE * 1.2 : 1000;
        }
    },

    weaving: {
        id: 'weaving',
        name: 'Tejido',
        icon: '🧵',
        category: TECH_CATEGORIES.ECONOMY,
        age: 8,
        description: 'Arte de tejer fibras para crear telas.',
        cost: { food: 90 },
        researchTime: 12,
        building: 'townCenter',
        prerequisites: [],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'villager') {
                    u.maxHp += 5;
                    u.hp += 5;
                }
            });
        }
    },

    // ========== PRIMERAS ALDEAS Y PROTO-CIVILIZACIÓN (9.000-8.000 a.C.) - EDADES 9-10 ==========
    mudBricks: {
        id: 'mudBricks',
        name: 'Ladrillos de Adobe',
        icon: '🧱',
        category: TECH_CATEGORIES.ARCHITECTURE,
        age: 9,
        description: 'Construcción con ladrillos de barro secados al sol.',
        cost: { food: 100, wood: 50 },
        researchTime: 20,
        building: 'townCenter',
        prerequisites: ['pottery'],
        apply: (game) => {
            game.buildings.forEach(b => {
                b.maxHp = Math.floor(b.maxHp * 1.15);
                b.hp = Math.min(b.hp * 1.15, b.maxHp);
            });
        }
    },

    irrigation: {
        id: 'irrigation',
        name: 'Irrigación',
        icon: '💧',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 10,
        description: 'Sistemas de riego para cultivos.',
        cost: { food: 120, wood: 60 },
        researchTime: 25,
        building: 'storage',
        prerequisites: ['agriculture'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.35;
        }
    },

    // ========== EDAD DEL COBRE (8.000-6.000 a.C.) - EDADES 11-15 ==========
    copperWorking: {
        id: 'copperWorking',
        name: 'Trabajo del Cobre',
        icon: '🔨',
        category: TECH_CATEGORIES.TOOLS,
        age: 11,
        description: 'Primera metalurgia: trabajo del cobre.',
        cost: { food: 150, wood: 75 },
        researchTime: 30,
        building: 'storage',
        prerequisites: [],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.2;
        }
    },

    wheel: {
        id: 'wheel',
        name: 'La Rueda',
        icon: '☸️',
        category: TECH_CATEGORIES.TOOLS,
        age: 12,
        description: 'Invención revolucionaria para transporte.',
        cost: { food: 175, wood: 100 },
        researchTime: 35,
        building: 'storage',
        prerequisites: ['copperWorking'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'villager') {
                    u.speed *= 1.15;
                }
            });
        }
    },

    loom: {
        id: 'loom',
        name: 'Telar',
        icon: '🧶',
        category: TECH_CATEGORIES.ECONOMY,
        age: 13,
        description: 'Telar mejorado para producción textil.',
        cost: { food: 100, gold: 50 },
        researchTime: 20,
        building: 'townCenter',
        prerequisites: ['weaving'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'villager') {
                    u.maxHp += 15;
                    u.hp += 15;
                }
            });
        }
    },

    writing: {
        id: 'writing',
        name: 'Escritura',
        icon: '📜',
        category: TECH_CATEGORIES.CULTURE,
        age: 15,
        description: 'Desarrollo de la escritura cuneiforme.',
        cost: { food: 200, gold: 100 },
        researchTime: 40,
        building: 'townCenter',
        prerequisites: ['caveArt'],
        apply: (game) => {
            // Bonus de investigación futuro
        }
    },

    // ========== EDAD DEL BRONCE INICIAL Y TEMPRANA (5.500-4.500 a.C.) - EDADES 16-17 ==========
    bronzeWorking: {
        id: 'bronzeWorking',
        name: 'Trabajo del Bronce',
        icon: '⚒️',
        category: TECH_CATEGORIES.TOOLS,
        age: 16,
        description: 'Aleación de cobre y estaño: el bronce.',
        cost: { food: 200, gold: 150 },
        researchTime: 45,
        building: 'storage',
        prerequisites: ['copperWorking'],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.25;
        }
    },

    horseColar: {
        id: 'horseColar',
        name: 'Doma de Caballos',
        icon: '🐴',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 17,
        description: 'Domesticación del caballo.',
        cost: { food: 250, wood: 125 },
        researchTime: 40,
        building: 'storage',
        prerequisites: ['domestication', 'wheel'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.25;
        }
    },

    // ========== EDAD DEL BRONCE MEDIO (4.500-3.000 a.C.) - EDADES 18-20 ==========
    plow: {
        id: 'plow',
        name: 'Arado',
        icon: '🚜',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 18,
        description: 'Arado para agricultura intensiva.',
        cost: { food: 275, wood: 150 },
        researchTime: 45,
        building: 'storage',
        prerequisites: ['horseColar', 'agriculture'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.4;
        }
    },

    stoneMasonry: {
        id: 'stoneMasonry',
        name: 'Albañilería en Piedra',
        icon: '🗿',
        category: TECH_CATEGORIES.ARCHITECTURE,
        age: 19,
        description: 'Construcción con bloques de piedra tallada.',
        cost: { food: 300, wood: 150 },
        researchTime: 50,
        building: 'townCenter',
        prerequisites: ['mudBricks'],
        apply: (game) => {
            game.buildings.forEach(b => {
                b.maxHp = Math.floor(b.maxHp * 1.25);
                b.hp = Math.min(b.hp * 1.25, b.maxHp);
            });
        }
    },

    sailBoat: {
        id: 'sailBoat',
        name: 'Barco de Vela',
        icon: '⛵',
        category: TECH_CATEGORIES.ECONOMY,
        age: 20,
        description: 'Navegación con vela para comercio.',
        cost: { food: 250, wood: 200 },
        researchTime: 45,
        building: 'storage',
        prerequisites: ['wheel'],
        apply: (game) => {
            // Bonus de comercio
        }
    },

    // ========== GRANDES IMPERIOS Y APOGEO DEL BRONCE (3.000-2.000 a.C.) - EDADES 21-22 ==========
    doubleBitAxe: {
        id: 'doubleBitAxe',
        name: 'Hacha de Doble Filo',
        icon: '🪓',
        category: TECH_CATEGORIES.TOOLS,
        age: 21,
        description: 'Hacha de bronce con doble filo.',
        cost: { food: 300, gold: 150 },
        researchTime: 40,
        building: 'storage',
        prerequisites: ['bronzeWorking'],
        apply: (game) => {
            CONFIG.GATHER_RATES.wood *= 1.3;
        }
    },

    goldMining: {
        id: 'goldMining',
        name: 'Minería de Oro',
        icon: '⛏️',
        category: TECH_CATEGORIES.ECONOMY,
        age: 21,
        description: 'Técnicas avanzadas de extracción de oro.',
        cost: { food: 300, wood: 200 },
        researchTime: 45,
        building: 'storage',
        prerequisites: ['bronzeWorking'],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.3;
        }
    },

    wheelbarrow: {
        id: 'wheelbarrow',
        name: 'Carretilla',
        icon: '🛞',
        category: TECH_CATEGORIES.ECONOMY,
        age: 22,
        description: 'Carretilla para transportar materiales.',
        cost: { food: 350, wood: 175 },
        researchTime: 50,
        building: 'townCenter',
        prerequisites: ['wheel', 'loom'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'villager') {
                    u.speed *= 1.15;
                    u.maxHp = Math.floor(u.maxHp * 1.25);
                    u.hp = Math.min(u.hp * 1.25, u.maxHp);
                }
            });
        }
    },

    // ========== COLAPSO DEL BRONCE Y EDAD DEL HIERRO INICIAL (2.000-1.000 a.C.) - EDADES 23-24 ==========
    bronzeArmor: {
        id: 'bronzeArmor',
        name: 'Armadura de Bronce',
        icon: '🛡️',
        category: TECH_CATEGORIES.DEFENSE,
        age: 23,
        description: 'Armaduras completas de bronce.',
        cost: { food: 400, gold: 250 },
        researchTime: 55,
        building: 'barracks',
        prerequisites: ['bronzeWorking'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.maxHp += 20;
                    u.hp = Math.min(u.hp + 20, u.maxHp);
                }
            });
        }
    },

    ironWorking: {
        id: 'ironWorking',
        name: 'Trabajo del Hierro',
        icon: '⚙️',
        category: TECH_CATEGORIES.TOOLS,
        age: 24,
        description: 'Forja del hierro, más fuerte que el bronce.',
        cost: { food: 500, gold: 300 },
        researchTime: 60,
        building: 'storage',
        prerequisites: ['bronzeWorking'],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.35;
        }
    },

    // ========== EDAD DEL HIERRO (1.000-500 a.C.) - EDAD 25 ==========
    forging: {
        id: 'forging',
        name: 'Forja',
        icon: '🔥',
        category: TECH_CATEGORIES.MILITARY,
        age: 25,
        description: 'Técnicas avanzadas de forja de hierro.',
        cost: { food: 450, gold: 200 },
        researchTime: 50,
        building: 'barracks',
        prerequisites: ['ironWorking'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.attackDamage += 3;
                }
            });
        }
    },

    scaleMailArmor: {
        id: 'scaleMailArmor',
        name: 'Cota de Escamas',
        icon: '🥋',
        category: TECH_CATEGORIES.DEFENSE,
        age: 25,
        description: 'Armadura de escamas de hierro.',
        cost: { food: 400, gold: 200 },
        researchTime: 50,
        building: 'barracks',
        prerequisites: ['ironWorking'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.maxHp += 15;
                    u.hp = Math.min(u.hp + 15, u.maxHp);
                }
            });
        }
    },

    fletching: {
        id: 'fletching',
        name: 'Flechas con Plumas',
        icon: '🏹',
        category: TECH_CATEGORIES.MILITARY,
        age: 25,
        description: 'Flechas mejoradas con plumas estabilizadoras.',
        cost: { food: 400, gold: 175 },
        researchTime: 45,
        building: 'barracks',
        prerequisites: ['huntingBow'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.attackRange += 1;
                    u.attackDamage += 2;
                }
            });
        }
    },

    // ========== ERA CLÁSICA (500 a.C. - 500 d.C.) - EDADES 26-27 ==========
    bowSaw: {
        id: 'bowSaw',
        name: 'Sierra de Arco',
        icon: '🪚',
        category: TECH_CATEGORIES.TOOLS,
        age: 26,
        description: 'Sierra mejorada para corte de madera.',
        cost: { food: 500, gold: 250 },
        researchTime: 55,
        building: 'storage',
        prerequisites: ['doubleBitAxe'],
        apply: (game) => {
            CONFIG.GATHER_RATES.wood *= 1.35;
        }
    },

    philosophy: {
        id: 'philosophy',
        name: 'Filosofía',
        icon: '📚',
        category: TECH_CATEGORIES.CULTURE,
        age: 26,
        description: 'Desarrollo del pensamiento filosófico.',
        cost: { food: 600, gold: 400 },
        researchTime: 60,
        building: 'townCenter',
        prerequisites: ['writing'],
        apply: (game) => {
            // Reduce tiempos de investigación
        }
    },

    ironCasting: {
        id: 'ironCasting',
        name: 'Fundición de Hierro',
        icon: '🔧',
        category: TECH_CATEGORIES.MILITARY,
        age: 27,
        description: 'Técnicas de fundición para hierro de alta calidad.',
        cost: { food: 650, gold: 350 },
        researchTime: 60,
        building: 'barracks',
        prerequisites: ['forging'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.attackDamage += 4;
                }
            });
        }
    },

    chainMailArmor: {
        id: 'chainMailArmor',
        name: 'Cota de Malla',
        icon: '⛓️',
        category: TECH_CATEGORIES.DEFENSE,
        age: 27,
        description: 'Armadura flexible de anillas entrelazadas.',
        cost: { food: 600, gold: 300 },
        researchTime: 55,
        building: 'barracks',
        prerequisites: ['scaleMailArmor'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.maxHp += 20;
                    u.hp = Math.min(u.hp + 20, u.maxHp);
                }
            });
        }
    },

    bodkinArrow: {
        id: 'bodkinArrow',
        name: 'Flecha Bodkin',
        icon: '➶',
        category: TECH_CATEGORIES.MILITARY,
        age: 27,
        description: 'Flechas con punta de acero para penetrar armaduras.',
        cost: { food: 600, gold: 300 },
        researchTime: 55,
        building: 'barracks',
        prerequisites: ['fletching'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.attackRange += 1;
                    u.attackDamage += 3;
                }
            });
        }
    },

    architecture: {
        id: 'architecture',
        name: 'Arquitectura',
        icon: '🏛️',
        category: TECH_CATEGORIES.ARCHITECTURE,
        age: 27,
        description: 'Arquitectura clásica romana y griega.',
        cost: { food: 700, wood: 350 },
        researchTime: 65,
        building: 'townCenter',
        prerequisites: ['stoneMasonry'],
        apply: (game) => {
            game.buildings.forEach(b => {
                b.maxHp = Math.floor(b.maxHp * 1.35);
                b.hp = Math.min(b.hp * 1.35, b.maxHp);
            });
        }
    },

    // ========== ALTA EDAD MEDIA (500-1000 d.C.) - EDAD 28 ==========
    heavyPlow: {
        id: 'heavyPlow',
        name: 'Arado Pesado',
        icon: '🚜',
        category: TECH_CATEGORIES.AGRICULTURE,
        age: 28,
        description: 'Arado pesado para tierras difíciles.',
        cost: { food: 750, gold: 400 },
        researchTime: 65,
        building: 'storage',
        prerequisites: ['plow', 'horseColar'],
        apply: (game) => {
            CONFIG.GATHER_RATES.food *= 1.5;
        }
    },

    stirrup: {
        id: 'stirrup',
        name: 'Estribo',
        icon: '🏇',
        category: TECH_CATEGORIES.MILITARY,
        age: 28,
        description: 'Estribo para mejor control en caballería.',
        cost: { food: 700, gold: 350 },
        researchTime: 60,
        building: 'barracks',
        prerequisites: ['horseColar'],
        apply: (game) => {
            // Mejora unidades de caballería
        }
    },

    paddedArmorArcher: {
        id: 'paddedArmorArcher',
        name: 'Armadura Acolchada',
        icon: '🦺',
        category: TECH_CATEGORIES.DEFENSE,
        age: 28,
        description: 'Armadura acolchada para arqueros.',
        cost: { food: 500, gold: 250 },
        researchTime: 50,
        building: 'barracks',
        prerequisites: [],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.maxHp += 15;
                    u.hp = Math.min(u.hp + 15, u.maxHp);
                }
            });
        }
    },

    // ========== BAJA EDAD MEDIA (1000-1500 d.C.) - EDAD 29 ==========
    goldShaftMining: {
        id: 'goldShaftMining',
        name: 'Minería de Pozo Profundo',
        icon: '⚒️',
        category: TECH_CATEGORIES.ECONOMY,
        age: 29,
        description: 'Técnicas avanzadas para minas profundas.',
        cost: { food: 800, gold: 450 },
        researchTime: 70,
        building: 'storage',
        prerequisites: ['goldMining'],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.4;
        }
    },

    plateMailArmor: {
        id: 'plateMailArmor',
        name: 'Armadura de Placas',
        icon: '🪖',
        category: TECH_CATEGORIES.DEFENSE,
        age: 29,
        description: 'Armadura completa de placas de acero.',
        cost: { food: 900, gold: 500 },
        researchTime: 75,
        building: 'barracks',
        prerequisites: ['chainMailArmor'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.maxHp += 30;
                    u.hp = Math.min(u.hp + 30, u.maxHp);
                }
            });
        }
    },

    leatherArmorArcher: {
        id: 'leatherArmorArcher',
        name: 'Armadura de Cuero Reforzado',
        icon: '🦺',
        category: TECH_CATEGORIES.DEFENSE,
        age: 29,
        description: 'Armadura de cuero con refuerzos metálicos.',
        cost: { food: 700, gold: 400 },
        researchTime: 60,
        building: 'barracks',
        prerequisites: ['paddedArmorArcher'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.maxHp += 20;
                    u.hp = Math.min(u.hp + 20, u.maxHp);
                }
            });
        }
    },

    bracer: {
        id: 'bracer',
        name: 'Brazal y Arco Largo',
        icon: '🎯',
        category: TECH_CATEGORIES.MILITARY,
        age: 29,
        description: 'Arco largo con mayor alcance y potencia.',
        cost: { food: 900, gold: 500 },
        researchTime: 70,
        building: 'barracks',
        prerequisites: ['bodkinArrow'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.attackRange += 2;
                    u.attackDamage += 4;
                }
            });
        }
    },

    blastFurnace: {
        id: 'blastFurnace',
        name: 'Alto Horno',
        icon: '🏭',
        category: TECH_CATEGORIES.MILITARY,
        age: 29,
        description: 'Alto horno para acero de alta calidad.',
        cost: { food: 1000, gold: 600 },
        researchTime: 80,
        building: 'barracks',
        prerequisites: ['ironCasting'],
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.attackDamage += 5;
                }
            });
        }
    },

    guilds: {
        id: 'guilds',
        name: 'Gremios',
        icon: '👥',
        category: TECH_CATEGORIES.ECONOMY,
        age: 29,
        description: 'Organización de artesanos en gremios.',
        cost: { food: 800, gold: 500 },
        researchTime: 70,
        building: 'townCenter',
        prerequisites: ['philosophy'],
        apply: (game) => {
            // Bonus de producción
        }
    },

    // ========== ERA MODERNA TEMPRANA (1500-2000 d.C.) - EDAD 30 ==========
    gunpowder: {
        id: 'gunpowder',
        name: 'Pólvora',
        icon: '💥',
        category: TECH_CATEGORIES.MILITARY,
        age: 30,
        description: 'Invención de la pólvora y armas de fuego.',
        cost: { food: 1200, gold: 800 },
        researchTime: 90,
        building: 'barracks',
        prerequisites: ['blastFurnace'],
        apply: (game) => {
            // Revoluciona el combate
        }
    },

    printingPress: {
        id: 'printingPress',
        name: 'Imprenta',
        icon: '📰',
        category: TECH_CATEGORIES.CULTURE,
        age: 30,
        description: 'Imprenta de tipos móviles.',
        cost: { food: 1000, gold: 600 },
        researchTime: 85,
        building: 'townCenter',
        prerequisites: ['writing', 'guilds'],
        apply: (game) => {
            // Reduce significativamente tiempos de investigación
        }
    },

    navigation: {
        id: 'navigation',
        name: 'Navegación Oceánica',
        icon: '🧭',
        category: TECH_CATEGORIES.ECONOMY,
        age: 30,
        description: 'Técnicas de navegación para exploración global.',
        cost: { food: 1100, gold: 700 },
        researchTime: 90,
        building: 'storage',
        prerequisites: ['sailBoat', 'philosophy'],
        apply: (game) => {
            // Permite exploración avanzada
        }
    },

    banking: {
        id: 'banking',
        name: 'Banca',
        icon: '🏦',
        category: TECH_CATEGORIES.ECONOMY,
        age: 30,
        description: 'Sistema bancario moderno.',
        cost: { food: 1200, gold: 900 },
        researchTime: 95,
        building: 'townCenter',
        prerequisites: ['guilds', 'goldShaftMining'],
        apply: (game) => {
            CONFIG.GATHER_RATES.gold *= 1.5;
        }
    }
};

class TechManager {
    constructor(game) {
        this.game = game;
        this.researchedTechs = new Set();
        this.researchQueue = []; // { techId, timer }
        this.currentAge = 1; // Edad actual de la civilización
    }

    canResearch(techId) {
        const tech = TECHNOLOGIES[techId];
        if (!tech) return false;
        if (this.researchedTechs.has(techId)) return false;

        // Verificar si la tecnología está disponible en la edad actual
        if (tech.age > this.currentAge) return false;

        // Verificar si ya se está investigando
        if (this.researchQueue.some(item => item.techId === techId)) return false;

        // Verificar prerequisitos
        if (tech.prerequisites && tech.prerequisites.length > 0) {
            for (let prereq of tech.prerequisites) {
                if (!this.researchedTechs.has(prereq)) {
                    return false;
                }
            }
        }

        if (!this.game.canAfford(tech.cost)) return false;
        return true;
    }

    // Verificar si la tecnología está bloqueada por prerequisitos
    isLocked(techId) {
        const tech = TECHNOLOGIES[techId];
        if (!tech) return true;

        // Bloqueada si es de una edad futura
        if (tech.age > this.currentAge) return true;

        if (!tech.prerequisites) return false;

        for (let prereq of tech.prerequisites) {
            if (!this.researchedTechs.has(prereq)) {
                return true;
            }
        }
        return false;
    }

    // Obtener tecnologías por categoría
    getTechsByCategory(category) {
        return Object.values(TECHNOLOGIES).filter(tech => tech.category === category);
    }

    // Obtener tecnologías por edad
    getTechsByAge(age) {
        return Object.values(TECHNOLOGIES).filter(tech => tech.age === age);
    }

    // Avanzar a la siguiente edad
    advanceAge() {
        if (this.currentAge < 30) {
            this.currentAge++;
            this.game.showNotification(`¡Has avanzado a ${AGES[this.currentAge].name}!`, 'success');
            this.game.updateUI();
        }
    }

    startResearch(techId) {
        if (!this.canResearch(techId)) return;

        const tech = TECHNOLOGIES[techId];

        // Pagar costo
        for (let [res, amount] of Object.entries(tech.cost)) {
            this.game.resources[res] -= amount;
        }

        // Añadir a cola
        this.researchQueue.push({
            techId: techId,
            timer: tech.researchTime
        });

        this.game.updateUI();
        this.game.updateActionsPanel(); // Actualizar botones
        this.game.showNotification(`Investigando ${tech.name}...`, 'info');
    }

    update(deltaTime) {
        for (let i = this.researchQueue.length - 1; i >= 0; i--) {
            const item = this.researchQueue[i];
            item.timer -= deltaTime;

            if (item.timer <= 0) {
                this.completeResearch(item.techId);
                this.researchQueue.splice(i, 1);
            }
        }
    }

    completeResearch(techId) {
        const tech = TECHNOLOGIES[techId];
        this.researchedTechs.add(techId);
        tech.apply(this.game);
        this.game.showNotification(`¡${tech.name} investigado!`, 'success');
        this.game.updateActionsPanel(); // Quitar botón de la tecnología
    }

    isResearched(techId) {
        return this.researchedTechs.has(techId);
    }

    isResearching(techId) {
        return this.researchQueue.some(item => item.techId === techId);
    }

    getAvailableTechsForBuilding(buildingType) {
        return Object.values(TECHNOLOGIES).filter(tech =>
            tech.building === buildingType &&
            !this.researchedTechs.has(tech.id) &&
            !this.isResearching(tech.id) &&
            tech.age <= this.currentAge // Solo mostrar tecnologías de la edad actual o anterior
        );
    }

    getCurrentAge() {
        return AGES[this.currentAge];
    }
}
