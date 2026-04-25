
// ==========================================
// CONFIGURACIÓN DEL JUEGO
// ==========================================
export const TILE_SIZE = 32; // Tamaño de celda en píxeles

// Fog of War States
export const FOW_STATES = {
    HIDDEN: 0,
    EXPLORED: 1,
    VISIBLE: 2
};

// Tamaños de mapa (en tiles de 32px)
export const MAP_SIZES = {
    tiny: { name: 'Pequeño', tiles: 120, width: 3840, height: 3840 },
    small: { name: 'Chico', tiles: 144, width: 4608, height: 4608 },
    medium: { name: 'Mediano', tiles: 168, width: 5376, height: 5376 },
    normal: { name: 'Normal', tiles: 200, width: 6400, height: 6400 },
    large: { name: 'Grande', tiles: 220, width: 7040, height: 7040 },
    giant: { name: 'Gigante', tiles: 240, width: 7680, height: 7680 },
    ludicrous: { name: 'Absurdo', tiles: 480, width: 15360, height: 15360 }
};

// Gameplay Tips for Loading/Empty States
export const GAMEPLAY_TIPS = [
    "Usa [Tab] para encontrar aldeanos inactivos rápidamente, o [Shift] + [Tab] para ir atrás.",
    "Haz Doble Click en una unidad para seleccionar todas las del mismo tipo.",
    "Presiona [B] con un aldeano seleccionado para abrir el menú de construcción.",
    "Usa [F] para ciclar formaciones al tener múltiples unidades seleccionadas.",
    "Mantén tus recursos bajos gastándolos en unidades y mejoras.",
    "Explora el mapa para encontrar recursos adicionales.",
    "Usa la coma [,] para seleccionar a todo tu ejército rápidamente.",
    "Usa [Shift] + Click para añadir unidades a tu selección actual.",
    "Usa [Ctrl] + [1-9] para guardar grupos, y [1-9] para seleccionarlos.",
    "Presiona [H] o [Espacio] para volver a tu Centro Urbano."
];

// Tipos de terreno
export const TERRAIN_TYPES = {
    grassland: {
        name: 'Pastizal',
        color: '#7cb342',
        buildable: true,
        movementSpeed: 1.0,
        combatBonus: {
            cavalry: 1.15  // +15% ataque para caballería
        },
        resources: ['food'],  // Puede aparecer trigo/comida
        constructionSpeed: 1.0
    },
    forest: {
        name: 'Bosque',
        color: '#2e7d32',
        buildable: false,  // No se puede construir
        movementSpeed: 0.7,  // -30% velocidad
        combatBonus: {
            archer: 1.1  // +10% defensa para arqueros
        },
        resources: ['wood'],
        constructionSpeed: 0
    },
    water: {
        name: 'Agua',
        color: '#1976d2',
        buildable: false,
        movementSpeed: 0,  // Unidades terrestres no pueden pasar
        combatBonus: {},
        resources: ['food'],  // Pesca
        constructionSpeed: 0,
        requiresBoat: true
    },
    mountain: {
        name: 'Montaña',
        color: '#5d4037',
        buildable: false,
        movementSpeed: 0,  // Impassable
        combatBonus: {},
        resources: ['stone'],
        constructionSpeed: 0,
        impassable: true
    },
    hill: {
        name: 'Colina',
        color: '#8d6e63',
        buildable: true,
        movementSpeed: 0.6,  // -40% velocidad al subir
        combatBonus: {
            archer: 1.2,  // +20% alcance para arqueros
            defense: 1.15  // +15% defensa general
        },
        resources: ['stone'],
        constructionSpeed: 0.8  // -20% velocidad de construcción
    },
    desert: {
        name: 'Desierto',
        color: '#fdd835',
        buildable: true,
        movementSpeed: 0.85,  // -15% velocidad
        combatBonus: {},
        resources: ['gold'],
        constructionSpeed: 0.9
    },
    volcanic: {
        name: 'Volcánico',
        color: '#5c1d1d',
        buildable: true,
        movementSpeed: 0.75, // -25% velocidad (terreno hostil)
        combatBonus: {
            defense: 0.8 // -20% defensa general
        },
        resources: ['stone', 'gold'],
        constructionSpeed: 0.6
    },
    swamp: {
        name: 'Pantano Venenoso',
        color: '#2e4a2e',
        buildable: false,
        movementSpeed: 0.5, // -50% velocidad
        combatBonus: {
            defense: 0.5 // -50% defensa
        },
        resources: ['wood'],
        constructionSpeed: 0.4
    },
    archipelago: {
        name: 'Archipiélago',
        color: '#4fc3f7',
        buildable: false,
        movementSpeed: 0,
        combatBonus: {},
        resources: ['food'],
        constructionSpeed: 0,
        requiresBoat: true
    },
    snow: {
        name: 'Nieve',
        color: '#ffffff',
        buildable: true,
        movementSpeed: 0.8, // -20% velocidad
        combatBonus: {
            defense: 1.1 // +10% defensa
        },
        resources: ['gold', 'stone'],
        constructionSpeed: 0.8
    },
    tundra: {
        name: 'Tundra',
        color: '#a0b0a0',
        buildable: true,
        movementSpeed: 0.9, // -10% velocidad
        combatBonus: {},
        resources: ['wood', 'food'],
        constructionSpeed: 0.9
    }
};

// Bonus de daño de unidades (piedra, papel, tijera)
export const COMBAT_BONUSES = {
    warrior: {
        archer: 1.25,     // +25% daño contra arqueros
        spearman: 1.25,   // +25% daño contra lanceros
        building: 1.5     // +50% daño contra edificios (asedio base)
    },
    archer: {
        villager: 1.5,    // +50% daño contra aldeanos
        spearman: 1.5,    // +50% daño contra lanceros
        warrior: 0.8      // -20% daño contra guerreros (armadura)
    },
    spearman: {
        cavalry: 1.5      // +50% daño contra caballería
    },
    cavalry: {
        archer: 1.5,      // +50% daño contra arqueros
        warrior: 1.2      // +20% daño contra guerreros
    },
    villager: {
        building: 0.5     // -50% daño contra edificios
    }
};

export const CONFIG = {
    // Tamaño de mapa actual (se establece al iniciar el juego)
    CANVAS_WIDTH: 6400,  // Normal por defecto
    CANVAS_HEIGHT: 6400,
    CURRENT_MAP_SIZE: 'normal',

    // Recursos iniciales
    STARTING_WOOD: 200,
    STARTING_FOOD: 200,
    STARTING_GOLD: 100,
    STARTING_STONE: 100,

    // Población
    STARTING_POPULATION: 3,
    STARTING_MAX_POPULATION: 5,
    HOUSE_POPULATION_INCREASE: 5,

    // Tamaños de edificios (en tiles)
    BUILDING_SIZES: {
        house: { width: 3, height: 3 },
        barracks: { width: 4, height: 4 },
        townCenter: { width: 5, height: 5 },
        storage: { width: 2, height: 2 },
        storageWood: { width: 2, height: 2 },
        market: { width: 2, height: 2 },
        temple: { width: 2, height: 2 },
        workshop: { width: 2, height: 2 }
    },

    // Costos de construcción
    COSTS: {
        house: { wood: 30 },
        barracks: { wood: 175 },
        townCenter: { wood: 275, stone: 100 },
        storage: { wood: 100 },
        storageWood: { wood: 100 },
        market: { wood: 150, stone: 50 },
        temple: { wood: 200, gold: 100 },
        workshop: { wood: 200, gold: 50 }
    },

    // Costos de unidades
    UNIT_COSTS: {
        villager: { food: 50 },
        warrior: { food: 60, gold: 20 },
        archer: { food: 50, gold: 40, wood: 25 },
        trader: { food: 50, gold: 40, wood: 25 }
    },

    // Velocidades de recolección (por segundo)
    GATHER_RATES: {
        wood: 10,
        food: 8,
        gold: 5,
        stone: 4
    },

    // Fog of War & Vision
    VISION: {
        ENABLED: false, // Temporarily disabled at runtime to remove Fog of War overhead
        UPDATE_INTERVAL: 0.2, // Segundos entre actualizaciones de visión
        DEFAULT_UNIT: 250,    // Radio de visión por defecto para unidades
        DEFAULT_BUILDING: 350, // Radio de visión por defecto para edificios
        EXPLORED_OPACITY: 0.5  // Opacidad del terreno explorado pero no visible
    }
};
