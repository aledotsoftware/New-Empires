// ==========================================
// CONFIGURACIÓN DEL JUEGO
// ==========================================
const TILE_SIZE = 32; // Tamaño de celda en píxeles

// ==========================================
// VARIABLES GLOBALES
// ==========================================
// Exponer game y lastTime en el objeto window para acceso global
window.game = null;
window.lastTime = 0;

// También crear referencias locales para compatibilidad
let game = null;
let lastTime = 0;

// ==========================================
// COMPATIBILITY LAYER FOR CIVILIZATION MANAGER
// ==========================================
const civilizationManager = {
    getAllCivilizations: () => dataLoader.getAllCivilizations(),
    getCivilization: (id) => dataLoader.getCivilizationData(id),
    getStartingResources: (id) => {
        const civ = dataLoader.getCivilizationData(id);
        return civ ? (civ.startingResources || {}) : {};
    },
    getBuildSpeed: (id) => {
        const civ = dataLoader.getCivilizationData(id);
        return civ && civ.bonuses ? (civ.bonuses.buildSpeed || 1) : 1;
    },
    getTeamColor: (civId, team) => {
        const civ = dataLoader.getCivilizationData(civId);

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
    },
    applyBuildingBonuses: (building, civId) => {
        const civ = dataLoader.getCivilizationData(civId);
        if (!civ || !civ.bonuses) return;

        if (civ.bonuses.buildingHp) building.maxHp = Math.floor(building.maxHp * civ.bonuses.buildingHp);
        building.hp = building.isUnderConstruction ? 1 : building.maxHp;
    },
    applyUnitBonuses: (unit, civId) => {
        const civ = dataLoader.getCivilizationData(civId);
        if (!civ || !civ.bonuses) return;

        if (civ.bonuses.unitSpeed) unit.speed = (unit.speed || 100) * civ.bonuses.unitSpeed; // Asumiendo velocidad base
        if (civ.bonuses.unitAttack) unit.attackDamage = Math.floor(unit.attackDamage * civ.bonuses.unitAttack);
        if (civ.bonuses.gatherSpeed && unit.type === 'villager') {
            // La lógica de recolección usa CONFIG.GATHER_RATES, habría que ver cómo aplicarlo a la unidad individual
            // o si la unidad tiene un multiplicador propio.
            // Por ahora lo dejamos simple.
        }
    }
};

class GridMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.ceil(width / tileSize);
        this.rows = Math.ceil(height / tileSize);
        this.grid = new Array(this.cols * this.rows).fill(null);
    }

    getIndex(col, row) {
        return row * this.cols + col;
    }

    isAreaFree(startCol, startRow, widthTiles, heightTiles) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
                if (this.grid[this.getIndex(c, r)] !== null) return false;
            }
        }
        return true;
    }

    occupyArea(startCol, startRow, widthTiles, heightTiles, entity) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.grid[this.getIndex(c, r)] = entity;
                }
            }
        }
    }

    freeArea(startCol, startRow, widthTiles, heightTiles) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.grid[this.getIndex(c, r)] = null;
                }
            }
        }
    }

    snapToGrid(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return {
            x: col * this.tileSize,
            y: row * this.tileSize,
            col,
            row
        };
    }
}

// Clase para gestión de terrenos
class TerrainMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);
        this.grid = new Array(this.cols * this.rows).fill('grassland');

        this.generateTerrain();
    }

    generateTerrain() {
        // Generar bosques (15-20% del mapa)
        this.generatePatches('forest', 0.17, 8);

        // Generar agua (5-10% del mapa)
        this.generatePatches('water', 0.08, 12);

        // Generar montañas (3-5% del mapa)
        this.generatePatches('mountain', 0.04, 6);

        // Generar colinas (8-12% del mapa)
        this.generatePatches('hill', 0.10, 5);

        // Generar desiertos (5-8% del mapa)
        this.generatePatches('desert', 0.06, 7);
    }

    generatePatches(terrainType, coverage, patchSize) {
        const targetTiles = Math.floor(this.grid.length * coverage);
        let tilesPlaced = 0;
        const maxAttempts = targetTiles * 3;
        let attempts = 0;

        while (tilesPlaced < targetTiles && attempts < maxAttempts) {
            attempts++;
            const startCol = Math.floor(Math.random() * this.cols);
            const startRow = Math.floor(Math.random() * this.rows);

            // Crear parche usando distribución aleatoria
            const patchTiles = Math.floor(patchSize + Math.random() * patchSize);
            for (let i = 0; i < patchTiles; i++) {
                const offsetX = Math.floor(Math.random() * patchSize) - patchSize / 2;
                const offsetY = Math.floor(Math.random() * patchSize) - patchSize / 2;
                const col = startCol + offsetX;
                const row = startRow + offsetY;

                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const index = this.getIndex(col, row);
                    if (this.grid[index] === 'grassland') {
                        this.grid[index] = terrainType;
                        tilesPlaced++;
                        if (tilesPlaced >= targetTiles) break;
                    }
                }
            }
        }
    }

    getIndex(col, row) {
        return row * this.cols + col;
    }

    getTerrainAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 'grassland';
        }

        const index = this.getIndex(col, row);
        return this.grid[index];
    }

    getTerrainData(terrainType) {
        return TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.grassland;
    }

    canBuildAt(x, y, widthTiles, heightTiles) {
        for (let i = 0; i < widthTiles; i++) {
            for (let j = 0; j < heightTiles; j++) {
                const checkX = x + (i * this.tileSize);
                const checkY = y + (j * this.tileSize);
                const terrain = this.getTerrainAt(checkX, checkY);
                const terrainData = this.getTerrainData(terrain);
                if (!terrainData.buildable) {
                    return false;
                }
            }
        }
        return true;
    }
}


// Tamaños de mapa (en tiles de 32px)
const MAP_SIZES = {
    tiny: { name: 'Pequeño', tiles: 120, width: 3840, height: 3840 },
    small: { name: 'Chico', tiles: 144, width: 4608, height: 4608 },
    medium: { name: 'Mediano', tiles: 168, width: 5376, height: 5376 },
    normal: { name: 'Normal', tiles: 200, width: 6400, height: 6400 },
    large: { name: 'Grande', tiles: 220, width: 7040, height: 7040 },
    giant: { name: 'Gigante', tiles: 240, width: 7680, height: 7680 },
    ludicrous: { name: 'Absurdo', tiles: 480, width: 15360, height: 15360 }
};

// Tipos de terreno
const TERRAIN_TYPES = {
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
    }
};

const CONFIG = {
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
    }
};

// ==========================================
// GESTOR DE ASSETS (Optimización de carga)
// ==========================================
class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedCount = 0;
        this.totalAssets = 0;
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.assets[key] = img;
                this.loadedCount++;
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.debug(`Asset cargado: ${key}`, 'assets', {
                        width: img.width,
                        height: img.height,
                        progress: `${this.loadedCount}/${this.totalAssets}`
                    });
                } else {
                    console.log(`✅ Asset cargado: ${key}`);
                }
                resolve(img);
            };
            img.onerror = () => {
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.warn(`No se pudo cargar asset`, 'assets', { key, src });
                } else {
                    console.warn(`⚠️ No se pudo cargar asset: ${key} (${src})`);
                }
                // Resolvemos igual para no bloquear el juego, pero sin imagen
                resolve(null);
            };
        });
    }

    async loadAll() {
        const assetsToLoad = [
            { key: 'villager', src: 'assets/icons/villager.png' },
            { key: 'warrior', src: 'assets/icons/warrior.png' },
            { key: 'archer', src: 'assets/icons/archer.png' },
            { key: 'townCenter', src: 'assets/icons/townCenter.png' },
            { key: 'house', src: 'assets/icons/house.png' },
            { key: 'barracks', src: 'assets/icons/barracks.png' },
            { key: 'storage', src: 'assets/icons/storage.png' },
            { key: 'storageWood', src: 'assets/icons/storageWood.png' },
            { key: 'market', src: 'assets/icons/market.png' },
            { key: 'temple', src: 'assets/icons/temple.png' },
            { key: 'workshop', src: 'assets/icons/workshop.png' }
        ];

        this.totalAssets = assetsToLoad.length;

        if (typeof debugLogger !== 'undefined') {
            debugLogger.start('Cargando assets gráficos', 'assets');
            debugLogger.time('Carga de assets', 'assets');
        } else {
            console.log('🔄 Iniciando carga de assets...');
        }

        const promises = assetsToLoad.map(asset => this.loadImage(asset.key, asset.src));
        await Promise.all(promises);

        const loadedCount = Object.keys(this.assets).length;
        if (typeof debugLogger !== 'undefined') {
            debugLogger.timeEnd('Carga de assets', 'assets');
            debugLogger.success(`${loadedCount}/${this.totalAssets} assets cargados`, 'assets', {
                cargados: Object.keys(this.assets)
            });
        } else {
            console.log('✨ Todos los assets procesados.');
        }
    }

    getImage(key) {
        return this.assets[key];
    }
}

const assetLoader = new AssetLoader();

// ==========================================
// CLASE PRINCIPAL DEL JUEGO
// ==========================================
class Game {
    constructor(civId = 'romans', mapConfig = null) {
        this.civilizationId = civId;
        this.civilization = civilizationManager.getCivilization(civId);
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimap = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimap.getContext('2d');

        // Configuración del mapa procedural
        this.mapConfig = mapConfig || {
            seed: Date.now(),
            width: Math.floor(CONFIG.CANVAS_WIDTH / TILE_SIZE),
            height: Math.floor(CONFIG.CANVAS_HEIGHT / TILE_SIZE),
            numPlayers: 2,
            biome: 'grassland',
            style: 'continental'
        };

        // Configurar dimensiones
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Estado del juego
        this.gameStartTime = Date.now();
        this.isPaused = false;
        this.isGameOver = false;

        // Recursos
        this.resources = {
            wood: CONFIG.STARTING_WOOD,
            food: CONFIG.STARTING_FOOD,
            gold: CONFIG.STARTING_GOLD,
            stone: CONFIG.STARTING_STONE
        };

        // Aplicar recursos extra de la civilización
        const bonusResources = civilizationManager.getStartingResources(this.civilizationId);
        this.resources.wood += bonusResources.wood || 0;
        this.resources.food += bonusResources.food || 0;
        this.resources.gold += bonusResources.gold || 0;
        this.resources.stone += bonusResources.stone || 0;

        this.population = CONFIG.STARTING_POPULATION;
        this.maxPopulation = CONFIG.STARTING_MAX_POPULATION;

        // Entidades del juego
        this.entities = [];
        this.selectedEntities = [];
        this.buildings = [];
        this.units = [];
        this.enemies = [];
        this.resourceNodes = [];

        // Control de cámara
        this.camera = { x: 0, y: 0 };

        // Configuración avanzada de cámara RTS
        this.cameraConfig = {
            baseSpeed: 800,      // Píxeles por segundo (teclado)
            edgeSpeed: 1200,      // Velocidad máxima en bordes
            edgeThreshold: 30,   // Margen en píxeles para activar scroll
            smoothness: 0.1      // Factor de suavizado (lerp)
        };

        this.hasMouseMoved = false;
        this.keysPressed = {}; // Estado de teclas para movimiento suave

        // Configuración de visualización
        this.showGrid = true; // Mostrar/ocultar cuadrícula (configurable)

        // Configuración de aldeanos inactivos
        this.enableIdleVillagerCycle = true; // Habilitar ciclo de aldeanos inactivos con TAB
        this.idleVillagerIndex = 0; // Índice para el ciclo de aldeanos inactivos

        // Mouse
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        // Modo de construcción
        // Modo de construcción
        this.buildMode = null;
        this.buildGhost = null;

        this.setupEventListeners();

        // OPTIMIZACIÓN: Inicializar Spatial Grid
        this.spatialGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);

        // SISTEMA DE GRID (Cuadrícula de construcción y colisiones)
        this.gridMap = new GridMap(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, TILE_SIZE);

        // SISTEMA DE TERRENOS
        this.terrainMap = new TerrainMap(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, TILE_SIZE);

        // SISTEMA DE TECNOLOGÍAS
        this.techManager = new TechManager(this);

        this.initializeGame();
        this.updateUI();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.viewWidth = this.canvas.width;
        this.viewHeight = this.canvas.height;
    }

    initializeGame() {
        // Crear mapa
        this.generateMap();

        // Crear Centro Urbano inicial (jugador)
        const townCenter = new TownCenter(400, 400, 'player');
        this.buildings.push(townCenter);
        this.entities.push(townCenter);

        // Crear aldeanos iniciales
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = 400 + Math.cos(angle) * 100;
            const y = 400 + Math.sin(angle) * 100;
            const villager = new Villager(x, y, 'player');
            this.units.push(villager);
            this.entities.push(villager);
        }

        // Crear enemigos básicos
        this.spawnEnemies();

        // Centrar cámara en el Centro Urbano
        this.camera.x = 400 - this.viewWidth / 2;
        this.camera.y = 400 - this.viewHeight / 2;
    }

    generateMap() {
        // Usar el generador procedural de mapas
        if (typeof ProceduralMapGenerator !== 'undefined') {
            console.log('🗺️ Usando generador procedural de mapas');

            const mapGen = new ProceduralMapGenerator(this.mapConfig);
            const generatedMap = mapGen.generate();

            // Aplicar el mapa generado al TerrainMap existente
            this.applyProceduralTerrain(generatedMap);

            // Aplicar recursos generados
            this.applyProceduralResources(generatedMap);

            // Guardar información de posiciones de jugadores
            this.proceduralPlayerStarts = generatedMap.playerStarts;

            // Guardar decoraciones para renderizado futuro
            this.proceduralDecorations = generatedMap.decorations;

            console.log(`✅ Mapa procedural aplicado (Semilla: ${generatedMap.metadata.seed})`);
        } else {
            // Fallback: generación simple de recursos (código original)
            console.log('⚠️ Generador procedural no disponible, usando generación simple');
            this.generateSimpleMap();
        }
    }

    applyProceduralTerrain(generatedMap) {
        // Aplicar tipos de terreno del mapa generado al TerrainMap existente
        const { terrainTypes, heightmap } = generatedMap;

        for (let y = 0; y < terrainTypes.length; y++) {
            for (let x = 0; x < terrainTypes[y].length; x++) {
                const terrainType = terrainTypes[y][x];
                const index = this.terrainMap.getIndex(x, y);

                if (index >= 0 && index < this.terrainMap.grid.length) {
                    this.terrainMap.grid[index] = terrainType;
                }
            }
        }
    }

    applyProceduralResources(generatedMap) {
        // Convertir recursos del mapa generado al formato del juego
        const resourceIcons = {
            wood: '🌲',
            food: '🌾',
            gold: '💎',
            stone: '🪨'
        };

        this.resourceNodes = [];

        for (let res of generatedMap.resources) {
            this.resourceNodes.push({
                x: res.x * TILE_SIZE,
                y: res.y * TILE_SIZE,
                type: res.type,
                icon: resourceIcons[res.type] || '❓',
                amount: res.amount,
                radius: 20,
                playerId: res.playerId || null
            });
        }
    }

    generateSimpleMap() {
        // Código original de generación simple (fallback)
        const resourceTypes = [
            { type: 'wood', icon: '🌲', amount: 500 },
            { type: 'food', icon: '🌾', amount: 400 },
            { type: 'gold', icon: '💎', amount: 300 },
            { type: 'stone', icon: '🪨', amount: 300 }
        ];

        for (let i = 0; i < 20; i++) {
            const resType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const x = Math.random() * CONFIG.CANVAS_WIDTH;
            const y = Math.random() * CONFIG.CANVAS_HEIGHT;

            // Evitar spawn cerca del centro inicial
            if (Math.hypot(x - 400, y - 400) > 200) {
                this.resourceNodes.push({
                    x, y,
                    type: resType.type,
                    icon: resType.icon,
                    amount: resType.amount,
                    radius: 20
                });
            }
        }
    }

    spawnEnemies() {
        // Spawn enemigos en el lado opuesto
        for (let i = 0; i < 5; i++) {
            const x = CONFIG.CANVAS_WIDTH - 400 + Math.random() * 200 - 100;
            const y = CONFIG.CANVAS_HEIGHT - 400 + Math.random() * 200 - 100;
            const enemy = new Warrior(x, y, 'enemy');
            this.enemies.push(enemy);
            this.entities.push(enemy);
        }

        // Enemy town center
        const enemyTC = new TownCenter(CONFIG.CANVAS_WIDTH - 400, CONFIG.CANVAS_HEIGHT - 400, 'enemy');
        this.buildings.push(enemyTC);
        this.entities.push(enemyTC);
    }

    setupEventListeners() {
        // Mouse move
        window.addEventListener('mousemove', (e) => {
            this.hasMouseMoved = true;
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;

            if (this.isDragging) {
                // Dibuja el rectángulo de selección
            }
        });

        // Click izquierdo
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                if (this.buildMode) {
                    this.placeBuilding();
                } else {
                    this.isDragging = true;
                    this.dragStart = { x: this.mouse.worldX, y: this.mouse.worldY };
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                if (this.isDragging) {
                    this.selectEntities();
                    this.isDragging = false;
                }
            }
        });

        // Click derecho
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick();
        });

        // Teclado (keydown)
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key.toLowerCase()] = true;
            this.handleKeyPress(e);
        });

        // Teclado (keyup)
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key.toLowerCase()] = false;
        });

        // Minimapa click
        this.minimap.addEventListener('click', (e) => {
            const rect = this.minimap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const worldX = (x / this.minimap.width) * CONFIG.CANVAS_WIDTH;
            const worldY = (y / this.minimap.height) * CONFIG.CANVAS_HEIGHT;

            this.camera.x = worldX - this.viewWidth / 2;
            this.camera.y = worldY - this.viewHeight / 2;
        });
    }

    selectEntities() {
        const minX = Math.min(this.dragStart.x, this.mouse.worldX);
        const maxX = Math.max(this.dragStart.x, this.mouse.worldX);
        const minY = Math.min(this.dragStart.y, this.mouse.worldY);
        const maxY = Math.max(this.dragStart.y, this.mouse.worldY);

        this.selectedEntities = [];

        // Si es un click simple (área muy pequeña), seleccionar la entidad más cercana
        if (Math.abs(this.dragStart.x - this.mouse.worldX) < 10 &&
            Math.abs(this.dragStart.y - this.mouse.worldY) < 10) {

            let closest = null;
            let closestDist = Infinity;

            for (let entity of this.entities) {
                if (entity.team !== 'player') continue;

                const dist = Math.hypot(entity.x - this.mouse.worldX, entity.y - this.mouse.worldY);
                if (dist < entity.size && dist < closestDist) {
                    closest = entity;
                    closestDist = dist;
                }
            }

            if (closest) {
                this.selectedEntities = [closest];

                // Reproducir sonido de selección
                if (typeof soundManager !== 'undefined') {
                    soundManager.playEntitySelection(closest.type);
                }
            }
        } else {
            // Selección de área
            for (let entity of this.entities) {
                if (entity.team !== 'player') continue;

                if (entity.x >= minX && entity.x <= maxX &&
                    entity.y >= minY && entity.y <= maxY) {
                    this.selectedEntities.push(entity);
                }
            }
        }

        this.updateSelectionPanel();
        this.updateActionsPanel();
    }

    selectNextIdleVillager() {
        // Obtener todos los aldeanos inactivos del jugador
        const idleVillagers = this.units.filter(unit =>
            unit.type === 'villager' &&
            unit.team === 'player' &&
            unit.state === 'IDLE'
        );

        if (idleVillagers.length === 0) {
            this.showNotification('No hay aldeanos inactivos', 'info');
            return;
        }

        // Ciclar al siguiente aldeano inactivo
        this.idleVillagerIndex = this.idleVillagerIndex % idleVillagers.length;
        const villager = idleVillagers[this.idleVillagerIndex];

        // Seleccionar el aldeano
        this.selectedEntities = [villager];
        this.updateSelectionPanel();
        this.updateActionsPanel();

        // Centrar cámara en el aldeano
        this.camera.x = villager.x - this.viewWidth / 2;
        this.camera.y = villager.y - this.viewHeight / 2;

        // Incrementar índice para la próxima vez
        this.idleVillagerIndex++;
    }

    handleKeyPress(e) {
        const key = e.key.toUpperCase();
        console.log('⌨️ Tecla presionada:', key);

        // Hotkeys para botones del panel de control (grid 3x5)
        const hotkeyActions = {
            'Q': 0, 'W': 1, 'E': 2, 'R': 3, 'T': 4,  // Fila 1
            'A': 5, 'S': 6, 'D': 7, 'F': 8, 'G': 9,  // Fila 2
            'Z': 10, 'X': 11, 'C': 12, 'V': 13, 'B': 14  // Fila 3
        };

        // Verificar si la tecla es un hotkey del panel de control
        if (hotkeyActions.hasOwnProperty(key)) {
            console.log('🔑 Hotkey detectado:', key, '-> botón índice', hotkeyActions[key]);
            const btnIndex = hotkeyActions[key];
            const actionsGrid = document.getElementById('commandPanel');
            if (actionsGrid) {
                const buttons = actionsGrid.querySelectorAll('.action-btn');
                console.log('📊 Total botones encontrados:', buttons.length);
                if (buttons[btnIndex] && !buttons[btnIndex].classList.contains('disabled')) {
                    console.log('✅ Activando botón', btnIndex);
                    buttons[btnIndex].click();
                    e.preventDefault(); // Prevenir comportamiento por defecto
                    return;
                } else {
                    console.log('⚠️ Botón', btnIndex, 'no disponible o deshabilitado');
                }
            } else {
                console.log('❌ commandPanel no encontrado');
            }
        }

        // Otros hotkeys existentes...
        // (El resto de la lógica de teclas que pueda existir)
    }

    handleRightClick() {
        if (this.selectedEntities.length === 0) return;

        // Verificar si clickeó en un enemigo
        let targetEnemy = null;
        for (let enemy of this.enemies) {
            const dist = Math.hypot(enemy.x - this.mouse.worldX, enemy.y - this.mouse.worldY);
            if (dist < enemy.size) {
                targetEnemy = enemy;
                break;
            }
        }

        // Verificar si clickeó en un nodo de recursos
        let targetResource = null;
        for (let node of this.resourceNodes) {
            const dist = Math.hypot(node.x - this.mouse.worldX, node.y - this.mouse.worldY);
            if (dist < node.radius) {
                targetResource = node;
                break;
            }
        }

        // Verificar si clickeó en un edificio en construcción (propio)
        let targetBuilding = null;
        for (let building of this.buildings) {
            if (building.team === 'player' && building.isUnderConstruction) {
                const dist = Math.hypot(building.x - this.mouse.worldX, building.y - this.mouse.worldY);
                // Usar un radio aproximado basado en el tamaño del edificio
                if (dist < building.size / 2 + 20) {
                    targetBuilding = building;
                    break;
                }
            }
        }

        // Comandar unidades
        for (let entity of this.selectedEntities) {
            if (entity.isUnit) {
                if (targetEnemy && entity.canAttack) {
                    entity.attackTarget = targetEnemy;
                    entity.gatherTarget = null;
                    entity.targetX = null;
                    if (entity.type === 'villager') entity.state = 'ATTACKING';
                } else if (targetResource && entity.canGather) {
                    entity.gatherTarget = targetResource;
                    entity.attackTarget = null;
                    entity.targetX = null;
                    // Para aldeanos, tryGather se encargará, pero forzamos el inicio si es necesario
                    if (entity.type === 'villager') {
                        entity.state = 'GATHERING';
                        entity.currentResourceNode = targetResource;
                    }
                } else if (targetBuilding && entity.type === 'villager') {
                    // Asignar construcción
                    entity.state = 'BUILDING';
                    entity.buildTarget = targetBuilding;
                    entity.attackTarget = null;
                    entity.gatherTarget = null;
                    entity.targetX = null;
                } else {
                    entity.targetX = this.mouse.worldX;
                    entity.targetY = this.mouse.worldY;
                    entity.attackTarget = null;
                    entity.gatherTarget = null;
                    if (entity.type === 'villager') entity.state = 'MOVING';
                }
            }
        }
    }

    handleKeyPress(e) {
        // TAB - Seleccionar siguiente aldeano inactivo
        if (e.key === 'Tab') {
            e.preventDefault();
            if (this.enableIdleVillagerCycle) {
                this.selectNextIdleVillager();
            }
            return;
        }

        // B - Build menu
        if (e.key === 'b' || e.key === 'B') {
            if (this.selectedEntities.length === 1 &&
                this.selectedEntities[0].type === 'villager') {
                this.openBuildMenu();
            }
        }

        // ESC - Cancel
        if (e.key === 'Escape') {
            this.buildMode = null;
            this.closeBuildMenu();
        }

        // H o Space - Center on town center (ir al centro urbano)
        if (e.key === 'h' || e.key === 'H' || e.key === ' ') {
            e.preventDefault();
            const tc = this.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
            if (tc) {
                this.camera.x = tc.x - this.viewWidth / 2;
                this.camera.y = tc.y - this.viewHeight / 2;
            }
        }

        // Atajos de teclado para construcción rápida (Q, W, E, R)
        // Solo funciona cuando el menú de construcción está abierto
        const buildMenu = document.getElementById('buildMenu');
        if (buildMenu && !buildMenu.classList.contains('hidden')) {
            const buildingMap = {
                'q': 'house',
                'w': 'barracks',
                'e': 'townCenter',
                'r': 'storage',
                't': 'storageWood',
                'y': 'market',
                'u': 'temple',
                'i': 'workshop'
            };

            const key = e.key.toLowerCase();
            if (buildingMap[key]) {
                this.buildMode = buildingMap[key];
                this.closeBuildMenu();
            }
        }

        // WASD - Camera movement handled in updateCamera()
        // Eliminado manejo directo aquí para usar deltaTime y movimiento suave
    }

    openBuildMenu() {
        const buildMenu = document.getElementById('buildMenu');
        buildMenu.classList.remove('hidden');

        // Setup build options
        const buildOptions = document.querySelectorAll('.build-option');
        buildOptions.forEach((option, index) => {
            const selectOption = () => {
                const buildingType = option.dataset.building;
                this.startBuildMode(buildingType);
                this.closeBuildMenu();
            };

            option.onclick = selectOption;

            // Keyboard support for selecting options
            option.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectOption();
                }
            };
        });

        // Focus the first option for accessibility
        if (buildOptions.length > 0) {
            // Tiny timeout to ensure visibility transition doesn't interfere with focus
            setTimeout(() => {
                buildOptions[0].focus();
            }, 100);
        }
    }

    closeBuildMenu() {
        const buildMenu = document.getElementById('buildMenu');
        buildMenu.classList.add('hidden');

        // Restore focus to game canvas or previous element if possible
        if (this.canvas) {
            this.canvas.focus();
        }
    }

    startBuildMode(buildingType) {
        this.buildMode = buildingType;
        this.showNotification(`Selecciona ubicación para ${buildingType}`, 'info');
    }

    placeBuilding() {
        if (!this.buildMode) return;

        // Calcular posición en grid
        const snap = this.gridMap.snapToGrid(this.mouse.worldX, this.mouse.worldY);
        const size = CONFIG.BUILDING_SIZES[this.buildMode];

        // Verificar si el área está libre en el grid
        if (!this.gridMap.isAreaFree(snap.col, snap.row, size.width, size.height)) {
            this.showNotification('No se puede construir aquí: Espacio ocupado', 'error');
            return;
        }

        // Verificar si el terreno permite construcción
        if (!this.terrainMap.canBuildAt(snap.x, snap.y, size.width, size.height)) {
            this.showNotification('No se puede construir en este tipo de terreno', 'error');
            return;
        }

        const cost = CONFIG.COSTS[this.buildMode];
        if (!this.canAfford(cost)) {
            this.showNotification('Recursos insuficientes', 'error');
            return;
        }

        // Deducir recursos
        for (let [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }

        // Calcular centro del edificio basado en tiles
        const centerX = snap.x + (size.width * TILE_SIZE) / 2;
        const centerY = snap.y + (size.height * TILE_SIZE) / 2;

        // Crear edificio
        let building;
        switch (this.buildMode) {
            case 'house':
                building = new House(centerX, centerY, 'player');
                this.maxPopulation += CONFIG.HOUSE_POPULATION_INCREASE;
                break;
            case 'barracks':
                building = new Barracks(centerX, centerY, 'player');
                break;
            case 'townCenter':
                building = new TownCenter(centerX, centerY, 'player');
                break;
            case 'storage':
                building = new Storage(centerX, centerY, 'player');
                break;
            case 'storageWood':
                building = new StorageWood(centerX, centerY, 'player');
                break;
            case 'market':
                building = new Market(centerX, centerY, 'player');
                break;
            case 'temple':
                building = new Temple(centerX, centerY, 'player');
                break;
            case 'workshop':
                building = new Workshop(centerX, centerY, 'player');
                break;
        }

        if (building) {
            // Asignar propiedades de grid
            building.widthTiles = size.width;
            building.heightTiles = size.height;
            building.gridCol = snap.col;
            building.gridRow = snap.row;

            // Configurar construcción progresiva
            building.isUnderConstruction = true;
            building.constructionMaxHp = building.maxHp;
            building.hp = 1; // Comienza con 1 HP

            // Ocupar grid
            this.gridMap.occupyArea(snap.col, snap.row, size.width, size.height, building);

            // Aplicar bonificaciones de civilización
            civilizationManager.applyBuildingBonuses(building, this.civilizationId);

            this.buildings.push(building);
            this.entities.push(building);

            // Reproducir sonido de inicio de construcción
            if (typeof soundManager !== 'undefined') {
                soundManager.play('buildStart');
            }

            // Asignar al aldeano seleccionado para construir
            if (this.selectedEntities.length === 1 &&
                this.selectedEntities[0].type === 'villager' &&
                this.selectedEntities[0].team === 'player') {

                const villager = this.selectedEntities[0];
                villager.state = 'BUILDING';
                villager.buildTarget = building;
                villager.attackTarget = null;
                villager.gatherTarget = null;
                villager.targetX = null;
            }

            this.showNotification(`${building.name} (En construcción)`, 'info');
        }

        this.buildMode = null;
        this.updateUI();
    }

    canAfford(cost) {
        for (let [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }

    trainUnit(unitType, building) {
        if (building.isUnderConstruction) {
            this.showNotification('El edificio está en construcción', 'error');
            return;
        }

        const cost = CONFIG.UNIT_COSTS[unitType];

        if (!this.canAfford(cost)) {
            this.showNotification('Recursos insuficientes', 'error');
            return;
        }

        if (this.population >= this.maxPopulation) {
            this.showNotification('Límite de población alcanzado. Construye más casas.', 'error');
            return;
        }

        // Deducir recursos
        for (let [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }

        // Crear unidad cerca del edificio
        const angle = Math.random() * Math.PI * 2;
        const x = building.x + Math.cos(angle) * (building.size + 30);
        const y = building.y + Math.sin(angle) * (building.size + 30);

        let unit;
        switch (unitType) {
            case 'villager':
                unit = new Villager(x, y, 'player');
                break;
            case 'warrior':
                unit = new Warrior(x, y, 'player');
                break;
            case 'archer':
                unit = new Archer(x, y, 'player');
                break;
        }

        if (unit) {
            // Aplicar bonificaciones de civilización
            civilizationManager.applyUnitBonuses(unit, this.civilizationId);

            this.units.push(unit);
            this.entities.push(unit);
            this.population++;

            // Reproducir sonido de creación
            if (typeof soundManager !== 'undefined') {
                const soundKey = `create${unitType.charAt(0).toUpperCase() + unitType.slice(1)}`;
                soundManager.play(soundKey);
            }

            this.showNotification(`${unit.name} entrenado`, 'success');
            this.updateUI();
        }
    }

    updateCamera(deltaTime) {
        let dx = 0;
        let dy = 0;
        const dt = deltaTime; // Ya viene en segundos desde gameLoop

        // 1. Panning por teclado (WASD / Flechas)
        const keys = this.keysPressed;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Normalizar vector de teclado si es diagonal
        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy);
            dx = (dx / length) * this.cameraConfig.baseSpeed;
            dy = (dy / length) * this.cameraConfig.baseSpeed;
        }

        // 2. Panning por bordes (Edge Scrolling)
        if (this.hasMouseMoved) {
            const margin = this.cameraConfig.edgeThreshold;
            const maxSpeed = this.cameraConfig.edgeSpeed;

            // Factor de velocidad basado en qué tan cerca está del borde (0.0 a 1.0)
            let edgeDx = 0;
            let edgeDy = 0;

            if (this.mouse.x < margin) {
                edgeDx = -maxSpeed * ((margin - this.mouse.x) / margin);
            } else if (this.mouse.x > this.canvas.width - margin) {
                edgeDx = maxSpeed * ((this.mouse.x - (this.canvas.width - margin)) / margin);
            }

            if (this.mouse.y < margin) {
                edgeDy = -maxSpeed * ((margin - this.mouse.y) / margin);
            } else if (this.mouse.y > this.canvas.height - margin) {
                edgeDy = maxSpeed * ((this.mouse.y - (this.canvas.height - margin)) / margin);
            }

            // Sumar al movimiento (prioridad al borde si es mayor que teclado)
            if (edgeDx !== 0) dx = edgeDx;
            if (edgeDy !== 0) dy = edgeDy;
        }

        // 3. Aplicar movimiento con deltaTime
        if (dx !== 0 || dy !== 0) {
            this.camera.x += dx * dt;
            this.camera.y += dy * dt;

            // 4. Clamping (Límites del mapa)
            // Precalcular límites para evitar accesos repetidos
            const maxCamX = CONFIG.CANVAS_WIDTH - this.viewWidth;
            const maxCamY = CONFIG.CANVAS_HEIGHT - this.viewHeight;

            // Clamp eficiente
            if (this.camera.x < 0) this.camera.x = 0;
            else if (this.camera.x > maxCamX) this.camera.x = maxCamX;

            if (this.camera.y < 0) this.camera.y = 0;
            else if (this.camera.y > maxCamY) this.camera.y = maxCamY;
        }
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;

        // Actualizar cámara (Sistema RTS optimizado)
        this.updateCamera(deltaTime);

        // Actualizar tecnologías
        if (this.techManager) this.techManager.update(deltaTime);

        // OPTIMIZACIÓN: Actualizar Spatial Grid
        // Limpiar y reinsertar todas las entidades vivas
        this.spatialGrid.clear();
        for (let entity of this.entities) {
            this.spatialGrid.add(entity);
        }

        // Actualizar todas las entidades
        for (let entity of this.entities) {
            entity.update(deltaTime, this);
        }

        // Remover entidades muertas
        this.entities = this.entities.filter(e => !e.isDead);
        this.units = this.units.filter(u => !u.isDead);
        this.buildings = this.buildings.filter(b => !b.isDead);
        this.enemies = this.enemies.filter(e => !e.isDead);

        // Actualizar population count
        this.population = this.units.filter(u => u.team === 'player').length;

        // Remover de selección las entidades muertas
        this.selectedEntities = this.selectedEntities.filter(e => !e.isDead);

        // Verificar condiciones de victoria/derrota
        this.checkGameOver();

        // Actualizar UI
        this.updateUI();
    }

    checkGameOver() {
        const playerTownCenters = this.buildings.filter(b =>
            b.type === 'townCenter' && b.team === 'player' && !b.isDead
        );

        const enemyTownCenters = this.buildings.filter(b =>
            b.type === 'townCenter' && b.team === 'enemy' && !b.isDead
        );

        if (playerTownCenters.length === 0) {
            this.gameOver(false);
        } else if (enemyTownCenters.length === 0) {
            this.gameOver(true);
        }
    }

    gameOver(victory) {
        this.isGameOver = true;
        const screen = document.getElementById('gameOverScreen');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');

        if (victory) {
            title.textContent = '🏆 Victoria';
            title.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            message.textContent = '¡Has derrotado a todos los enemigos!';
        } else {
            title.textContent = '💀 Derrota';
            title.style.background = 'linear-gradient(135deg, #c53030, #9b2c2c)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            message.textContent = 'Tu Centro Urbano ha sido destruido.';
        }

        screen.classList.remove('hidden');
    }

    drawTerrain() {
        if (!this.terrainMap) return;

        const startCol = Math.floor(this.camera.x / TILE_SIZE);
        const startRow = Math.floor(this.camera.y / TILE_SIZE);
        const endCol = Math.ceil((this.camera.x + this.viewWidth) / TILE_SIZE);
        const endRow = Math.ceil((this.camera.y + this.viewHeight) / TILE_SIZE);

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (col < 0 || col >= this.terrainMap.cols || row < 0 || row >= this.terrainMap.rows) {
                    continue;
                }

                const index = this.terrainMap.getIndex(col, row);
                const terrainType = this.terrainMap.grid[index];
                const terrainData = TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.grassland;

                const x = Math.floor(col * TILE_SIZE - this.camera.x);
                const y = Math.floor(row * TILE_SIZE - this.camera.y);

                this.ctx.fillStyle = terrainData.color;
                this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                // Dibujar borde sutil para distinguir tiles
                // this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                // this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar terreno
        this.drawTerrain();

        // Dibujar grid (solo si está activado)
        if (this.showGrid) {
            this.drawGrid();
        }

        // Dibujar nodos de recursos
        this.drawResourceNodes();

        // Dibujar entidades
        for (let entity of this.entities) {
            entity.render(this.ctx, this.camera);
        }

        // Dibujar selección
        this.drawSelection();

        // Dibujar rectángulo de arrastre
        if (this.isDragging) {
            this.drawDragSelection();
        }

        // Dibujar fantasma de construcción
        if (this.buildMode) {
            this.drawBuildGhost();
        }

        // Renderizar minimapa
        this.renderMinimap();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = TILE_SIZE;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;

        for (let x = startX; x < this.camera.x + this.viewWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - this.camera.x, 0);
            this.ctx.lineTo(x - this.camera.x, this.viewHeight);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.camera.y + this.viewHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y - this.camera.y);
            this.ctx.lineTo(this.viewWidth, y - this.camera.y);
            this.ctx.stroke();
        }
    }

    drawResourceNodes() {
        for (let node of this.resourceNodes) {
            if (node.amount <= 0) continue;

            const screenX = node.x - this.camera.x;
            const screenY = node.y - this.camera.y;

            // Círculo de fondo
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, node.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Icon
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.icon, screenX, screenY);
        }
    }

    drawSelection() {
        this.ctx.strokeStyle = '#48bb78';
        this.ctx.lineWidth = 2;

        for (let entity of this.selectedEntities) {
            const screenX = entity.x - this.camera.x;
            const screenY = entity.y - this.camera.y;

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, entity.size + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawDragSelection() {
        const startX = this.dragStart.x - this.camera.x;
        const startY = this.dragStart.y - this.camera.y;
        const width = this.mouse.x - startX;
        const height = this.mouse.y - startY;

        this.ctx.strokeStyle = '#48bb78';
        this.ctx.fillStyle = 'rgba(72, 187, 120, 0.1)';
        this.ctx.lineWidth = 2;

        this.ctx.fillRect(startX, startY, width, height);
        this.ctx.strokeRect(startX, startY, width, height);
    }

    drawBuildGhost() {
        const snap = this.gridMap.snapToGrid(this.mouse.worldX, this.mouse.worldY);
        const size = CONFIG.BUILDING_SIZES[this.buildMode];

        const screenX = snap.x - this.camera.x;
        const screenY = snap.y - this.camera.y;
        const width = size.width * TILE_SIZE;
        const height = size.height * TILE_SIZE;

        const isFree = this.gridMap.isAreaFree(snap.col, snap.row, size.width, size.height);

        // Color basado en si es construible
        this.ctx.fillStyle = isFree ? 'rgba(72, 187, 120, 0.4)' : 'rgba(197, 48, 48, 0.4)';
        this.ctx.strokeStyle = isFree ? '#48bb78' : '#c53030';
        this.ctx.lineWidth = 2;

        // Dibujar rectángulo del edificio
        this.ctx.fillRect(screenX, screenY, width, height);
        this.ctx.strokeRect(screenX, screenY, width, height);

        // Dibujar icono centrado
        let icon = '🏗️';
        switch (this.buildMode) {
            case 'house': icon = '🏠'; break;
            case 'barracks': icon = '⚔️'; break;
            case 'townCenter': icon = '🏰'; break;
            case 'storage': icon = '📦'; break;
            case 'storageWood': icon = '🌲'; break;
            case 'market': icon = '🏪'; break;
            case 'temple': icon = '⛪'; break;
            case 'workshop': icon = '🔨'; break;
        }

        const fontSize = Math.min(width, height) * 0.6;
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(icon, screenX + width / 2, screenY + height / 2);

        // Dibujar grid local para referencia visual
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 1; i < size.width; i++) {
            this.ctx.moveTo(screenX + i * TILE_SIZE, screenY);
            this.ctx.lineTo(screenX + i * TILE_SIZE, screenY + height);
        }
        for (let i = 1; i < size.height; i++) {
            this.ctx.moveTo(screenX, screenY + i * TILE_SIZE);
            this.ctx.lineTo(screenX + width, screenY + i * TILE_SIZE);
        }
        this.ctx.stroke();
    }

    renderMinimap() {
        const scale = this.minimap.width / CONFIG.CANVAS_WIDTH;

        // Fondo
        this.minimapCtx.fillStyle = '#1a1a2e';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);

        // Recursos
        this.minimapCtx.fillStyle = '#4a5568';
        for (let node of this.resourceNodes) {
            if (node.amount > 0) {
                this.minimapCtx.fillRect(node.x * scale - 1, node.y * scale - 1, 2, 2);
            }
        }

        // Edificios
        for (let building of this.buildings) {
            const x = building.x * scale;
            const y = building.y * scale;
            const size = Math.max(4, building.size * scale * 2);

            if (building.image && building.image.complete) {
                this.minimapCtx.drawImage(building.image, x - size / 2, y - size / 2, size, size);
            } else {
                this.minimapCtx.fillStyle = building.team === 'player' ? '#48bb78' : '#c53030';
                this.minimapCtx.fillRect(x - 2, y - 2, 4, 4);
            }
        }

        // Unidades
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;

            // Unidades son muy pequeñas, mejor usar puntos de color brillante
            // Pero si el usuario quiere iconos, podemos intentar dibujar un punto más grande con el color del equipo
            this.minimapCtx.fillStyle = unit.team === 'player' ? '#63b3ed' : '#fc8181';
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(x, y, 2, 0, Math.PI * 2);
            this.minimapCtx.fill();
        }

        // Viewport
        this.minimapCtx.strokeStyle = '#d4af37';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(
            this.camera.x * scale,
            this.camera.y * scale,
            this.viewWidth * scale,
            this.viewHeight * scale
        );
    }

    updateUI() {
        // Recursos
        document.getElementById('woodCount').textContent = Math.floor(this.resources.wood);
        document.getElementById('foodCount').textContent = Math.floor(this.resources.food);
        document.getElementById('goldCount').textContent = Math.floor(this.resources.gold);
        document.getElementById('stoneCount').textContent = Math.floor(this.resources.stone);

        // Población
        document.getElementById('currentPopulation').textContent = this.population;
        document.getElementById('maxPopulation').textContent = this.maxPopulation;

        // Tiempo de juego
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('gameTime').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Actualizar paneles de selección y acciones
        // Eliminado chequeo de unitControlPanel (legacy) para soportar el nuevo HUD
        this.updateSelectionPanel();
        this.updateActionsPanel();
    }

    updateSelectionPanel() {
        const content = document.getElementById('selectionContent');
        if (!content) return;

        if (this.selectedEntities.length === 0) {
            content.innerHTML = `
                <div class="selection-empty-state" role="status" aria-live="polite" aria-disabled="true" aria-label="Nada seleccionado">
                    <div class="selection-empty-icon" aria-hidden="true">👆</div>
                    <div>Selecciona una unidad o edificio</div>
                </div>
            `;
            return;
        }

        if (this.selectedEntities.length === 1) {
            const entity = this.selectedEntities[0];
            content.innerHTML = `
                <div class="selection-info">
                    <div class="selection-icon">
                        ${entity.icon}
                    </div>
                    <div class="selection-details">
                        <h3>${entity.name}</h3>
                        <div class="selection-stats">
                            <div>HP: ${Math.floor(entity.hp)}/${entity.maxHp}</div>
                            ${entity.attackDamage ? `<div>Ataque: ${entity.attackDamage}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="selection-info">
                    <div class="selection-icon">
                        👥
                    </div>
                    <div class="selection-details">
                        <h3>${this.selectedEntities.length} Unidades</h3>
                        <div class="selection-stats">
                            <div>Selección múltiple</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    updateActionsPanel() {
        const grid = document.getElementById('commandPanel');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.selectedEntities.length !== 1) return;

        const entity = this.selectedEntities[0];

        // Solo mostrar acciones si es del jugador
        if (entity.team !== 'player') return;

        // Mapeo de hotkeys (posiciones en la cuadrícula 3x5)
        // Fila 1: Q W E R T
        // Fila 2: A S D F G
        // Fila 3: Z X C V B
        const hotkeys = [
            'Q', 'W', 'E', 'R', 'T',  // Fila 1
            'A', 'S', 'D', 'F', 'G',  // Fila 2
            'Z', 'X', 'C', 'V', 'B'   // Fila 3
        ];

        const buttons = [];

        if (entity.type === 'villager') {
            buttons.push({
                icon: '🏗️',
                label: 'Construir',
                hotkey: 'Q',
                description: 'Construye edificios para expandir tu imperio',
                action: () => this.openBuildMenu(),
                enabled: true
            });
        } else if (entity.type === 'townCenter') {
            const cost = CONFIG.UNIT_COSTS.villager;
            const canAfford = this.canAfford(cost);

            buttons.push({
                icon: '👨‍🌾',
                label: 'Aldeano',
                hotkey: 'Q',
                cost: `${cost.food}🌾`,
                description: 'Trabajador básico. Recolecta madera, comida, oro y piedra',
                action: () => this.trainUnit('villager', this.selectedEntities[0]),
                enabled: canAfford
            });
        } else if (entity.type === 'barracks') {
            const warriorCost = CONFIG.UNIT_COSTS.warrior;
            const archerCost = CONFIG.UNIT_COSTS.archer;
            const canAffordWarrior = this.canAfford(warriorCost);
            const canAffordArcher = this.canAfford(archerCost);

            buttons.push({
                icon: '⚔️',
                label: 'Guerrero',
                hotkey: 'Q',
                cost: `${warriorCost.food}🌾 ${warriorCost.gold}💰`,
                description: 'Unidad de infantería básica. Fuerte en combate cuerpo a cuerpo',
                action: () => this.trainUnit('warrior', this.selectedEntities[0]),
                enabled: canAffordWarrior
            });

            buttons.push({
                icon: '🏹',
                label: 'Arquero',
                hotkey: 'W',
                cost: `${archerCost.food}🌾 ${archerCost.gold}💰`,
                description: 'Unidad de ataque a distancia. Fuerte contra infantería ligera',
                action: () => this.trainUnit('archer', this.selectedEntities[0]),
                enabled: canAffordArcher
            });
        }

        // Añadir tecnologías disponibles
        if (this.techManager) {
            const availableTechs = this.techManager.getAvailableTechsForBuilding(entity.type);
            let techIndex = 0;
            for (let tech of availableTechs) {
                if (techIndex >= 13) break; // Máximo 13 botones más (15 - 2 ya usados como máximo)

                const canAfford = this.techManager.canResearch(tech.id);
                let costString = '';
                for (let [res, amount] of Object.entries(tech.cost)) {
                    const icon = res === 'food' ? '🌾' : res === 'wood' ? '🪵' : res === 'gold' ? '💰' : '🪨';
                    costString += `${amount}${icon} `;
                }

                buttons.push({
                    icon: tech.icon || '🔬',
                    label: tech.name,
                    hotkey: hotkeys[buttons.length],
                    cost: costString.trim(),
                    description: tech.description,
                    action: () => this.techManager.startResearch(tech.id),
                    enabled: canAfford
                });

                techIndex++;
            }
        }

        // Crear todos los 15 botones en el grid (3 filas x 5 columnas)
        for (let i = 0; i < 15; i++) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            const hotkey = hotkeys[i];
            btn.setAttribute('data-hotkey', hotkey);
            btn.setAttribute('aria-keyshortcuts', hotkey);

            if (i < buttons.length) {
                const buttonData = buttons[i];

                if (!buttonData.enabled) {
                    btn.classList.add('disabled');
                    btn.setAttribute('aria-disabled', 'true');
                }

                // Palette: Enhanced Accessibility & Tooltips
                let ariaLabel = `${buttonData.label} (${hotkey})`;
                if (buttonData.description) ariaLabel += `. ${buttonData.description}`;
                if (buttonData.cost) ariaLabel += `. Costo: ${buttonData.cost}`;
                btn.setAttribute('aria-label', ariaLabel);

                // No native title to avoid double tooltips and poor a11y
                btn.removeAttribute('title');

                btn.onclick = () => {
                    console.log('🖱️ Click en botón', i, 'disabled:', btn.classList.contains('disabled'), 'hasAction:', !!buttonData.action);
                    if (!btn.classList.contains('disabled') && buttonData.action) {
                        console.log('✅ Ejecutando acción del botón', i);
                        try {
                            buttonData.action();
                        } catch (error) {
                            console.error('❌ Error al ejecutar acción:', error);
                        }
                    }
                };

                // Palette: Custom Tooltip HTML - Constructed securely
                // Note: We use innerHTML for the button content structure but sanitize input values where possible
                // For a full refactor, document.createElement should be used for everything like in Game.js

                // Safe construction of cost HTML
                const costHtml = buttonData.cost ? `<div class="tooltip-cost">${buttonData.cost}</div>` : '';

                // Helper to escape HTML special chars just in case
                const escapeHtml = (text) => {
                    if (!text) return '';
                    return text
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                };

                const tooltipHtml = `
                    <div class="tooltip-header">${escapeHtml(buttonData.label)} <span class="tooltip-hotkey">[${hotkey}]</span></div>
                    <div class="tooltip-desc">${escapeHtml(buttonData.description || '')}</div>
                    ${costHtml}
                `;

                // Safe icon rendering using DOM methods
                btn.innerHTML = ''; // Clear existing content

                const hotkeyDiv = document.createElement('div');
                hotkeyDiv.className = 'btn-hotkey';
                hotkeyDiv.textContent = hotkey;
                btn.appendChild(hotkeyDiv);

                const iconDiv = document.createElement('div');
                iconDiv.className = 'btn-icon';
                // Check if icon is an emoji or path/HTML, but treat as text or use createSafeIconElement if available
                // In this context buttonData.icon is often an emoji, but could be malicious if from tech data.
                // We will use a safe approach.
                if (buttonData.icon && (buttonData.icon.includes('/') || buttonData.icon.includes('.'))) {
                     // Assume image path
                     const img = document.createElement('img');
                     img.src = buttonData.icon;
                     img.alt = buttonData.label;
                     img.className = 'icon-small';
                     img.onerror = function() { this.style.display = 'none'; }; // Hide if fails
                     iconDiv.appendChild(img);
                } else {
                     // Assume text/emoji
                     iconDiv.textContent = buttonData.icon;
                }
                btn.appendChild(iconDiv);

                const labelDiv = document.createElement('div');
                labelDiv.className = 'btn-label';
                labelDiv.textContent = buttonData.label;
                btn.appendChild(labelDiv);

                // Tooltip construction using DOM
                const tooltipDiv = document.createElement('div');
                tooltipDiv.className = 'btn-tooltip';
                tooltipDiv.setAttribute('role', 'tooltip');

                const tooltipHeader = document.createElement('div');
                tooltipHeader.className = 'tooltip-header';

                // Safe text node for header
                tooltipHeader.appendChild(document.createTextNode(buttonData.label + ' '));

                const tooltipHotkey = document.createElement('span');
                tooltipHotkey.className = 'tooltip-hotkey';
                tooltipHotkey.textContent = `[${hotkey}]`;
                tooltipHeader.appendChild(tooltipHotkey);
                tooltipDiv.appendChild(tooltipHeader);

                const tooltipDesc = document.createElement('div');
                tooltipDesc.className = 'tooltip-desc';
                tooltipDesc.textContent = buttonData.description || '';
                tooltipDiv.appendChild(tooltipDesc);

                if (buttonData.cost) {
                    const tooltipCost = document.createElement('div');
                    tooltipCost.className = 'tooltip-cost';
                    tooltipCost.textContent = buttonData.cost; // cost is string here
                    tooltipDiv.appendChild(tooltipCost);
                }

                btn.appendChild(tooltipDiv);

            } else {
                // Botón vacío
                btn.classList.add('disabled');
                btn.setAttribute('aria-disabled', 'true');
                btn.setAttribute('aria-label', `Ranura vacía ${hotkey}`);

                btn.innerHTML = '';
                const hotkeyDiv = document.createElement('div');
                hotkeyDiv.className = 'btn-hotkey';
                hotkeyDiv.textContent = hotkey;
                btn.appendChild(hotkeyDiv);

                const iconDiv = document.createElement('div');
                iconDiv.className = 'btn-icon';
                btn.appendChild(iconDiv);
            }

            grid.appendChild(btn);
        }
    }

    openBuildMenu() {
        console.log('🏗️ openBuildMenu() llamado');

        // Mostrar el modal de construcción
        const buildMenu = document.getElementById('buildMenu');
        if (buildMenu) {
            buildMenu.classList.remove('hidden');
            console.log('✅ Menú de construcción mostrado');
        } else {
            console.error('❌ No se encontró el elemento buildMenu');
            this.showNotification('Error: Menú de construcción no disponible', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'status');

        const icons = {
            info: 'ℹ️',
            error: '❌',
            success: '✅'
        };

        // Create elements securely
        const iconDiv = document.createElement('div');
        iconDiv.className = 'notification-icon';
        iconDiv.textContent = icons[type];

        const textDiv = document.createElement('div');
        textDiv.className = 'notification-text';
        textDiv.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        closeBtn.onclick = () => removeNotification();

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'notification-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress-bar';
        const duration = 4000; // 4 seconds
        progressBar.style.animationDuration = `${duration}ms`;
        progressContainer.appendChild(progressBar);

        notification.appendChild(iconDiv);
        notification.appendChild(textDiv);
        notification.appendChild(closeBtn);
        notification.appendChild(progressContainer);

        container.appendChild(notification);

        // Logic for auto-removal with pause on hover
        let remainingTime = duration;
        let startTime = Date.now();
        let timerId = null;
        let isPaused = false;

        const startTimer = () => {
            startTime = Date.now();
            timerId = setTimeout(() => {
                removeNotification();
            }, remainingTime);
            progressBar.style.animationPlayState = 'running';
        };

        const pauseTimer = () => {
            clearTimeout(timerId);
            const elapsed = Date.now() - startTime;
            remainingTime -= elapsed;
            isPaused = true;
            progressBar.style.animationPlayState = 'paused';
        };

        const removeNotification = () => {
            notification.classList.add('fading-out');
            notification.addEventListener('animationend', () => {
                if (notification.parentElement) {
                    notification.remove();
                }
            });
            // Fallback just in case animationend doesn't fire
            setTimeout(() => {
                if (notification.parentElement) notification.remove();
            }, 550);
        };

        notification.addEventListener('mouseenter', pauseTimer);
        notification.addEventListener('mouseleave', () => {
            if (isPaused) {
                isPaused = false;
                startTimer();
            }
        });

        // Start initial timer
        startTimer();
    }
}

// ==========================================
// OPTIMIZACIÓN: SPATIAL GRID
// ==========================================
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.buckets = new Map();
    }

    clear() {
        this.buckets.clear();
    }

    add(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.buckets.has(key)) {
            this.buckets.set(key, []);
        }
        this.buckets.get(key).push(entity);
    }

    getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    // Devuelve entidades en las celdas cercanas
    query(x, y, radius) {
        const found = [];
        const cellRadius = Math.ceil(radius / this.cellSize);

        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);

        const minCol = Math.max(0, centerCol - cellRadius);
        const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
        const minRow = Math.max(0, centerRow - cellRadius);
        const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);

        for (let c = minCol; c <= maxCol; c++) {
            for (let r = minRow; r <= maxRow; r++) {
                const key = `${c},${r}`;
                if (this.buckets.has(key)) {
                    const bucket = this.buckets.get(key);
                    for (let i = 0; i < bucket.length; i++) {
                        found.push(bucket[i]);
                    }
                }
            }
        }
        return found;
    }
}

// ==========================================
// CLASE BASE: ENTITY
// ==========================================
class Entity {
    constructor(x, y, team = 'neutral') {
        this.x = x;
        this.y = y;
        this.team = team;
        this.hp = 100;
        this.maxHp = 100;
        this.size = 20;
        this.isDead = false;
        this.icon = '❓';
        this.name = 'Entity';
        this.type = 'entity';
        this.isUnit = false;
        this.isBuilding = false;

        // Sistema de imágenes
        this.image = null;
        // Intentar cargar imagen automáticamente en el próximo ciclo
        setTimeout(() => this.loadIcon(), 0);
    }

    loadIcon() {
        if (!this.type) return;
        const preloadedImage = assetLoader.getImage(this.type);
        if (preloadedImage) {
            this.image = preloadedImage;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }

    update(deltaTime, game) {
        // Override en subclases
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX < -this.size || screenX > CONFIG.CANVAS_WIDTH + this.size ||
            screenY < -this.size || screenY > CONFIG.CANVAS_HEIGHT + this.size) {
            return;
        }

        // Dibujar fondo cuadrado en lugar de redondo
        ctx.fillStyle = this.getTeamColor();
        ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
        } else {
            ctx.font = `${this.size * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, screenX, screenY);
        }

        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - this.size - 10;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#48bb78';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }

    getTeamColor() {
        if (this.team === 'player' && game && game.civilizationId) {
            return civilizationManager.getTeamColor(game.civilizationId, this.team);
        }

        switch (this.team) {
            case 'player': return 'rgba(72, 187, 120, 0.3)';
            case 'enemy': return 'rgba(197, 48, 48, 0.3)';
            default: return 'rgba(160, 160, 160, 0.3)';
        }
    }
}

// ==========================================
// CLASE BASE: UNIT
// ==========================================
class Unit extends Entity {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 32;
        this.isUnit = true;
        this.speed = 50;
        this.targetX = null;
        this.targetY = null;
        this.attackTarget = null;
        this.gatherTarget = null;
        this.attackDamage = 5;
        this.attackSpeed = 1;
        this.attackRange = 50;
        this.attackCooldown = 0;
        this.canAttack = false;
        this.canGather = false;

        this.aiTimer = Math.random() * 0.5;
        this.aiCheckInterval = 0.5;
    }

    update(deltaTime, game) {
        this.aiTimer -= deltaTime;

        if (!this.attackTarget && this.canAttack && this.aiTimer <= 0) {
            this.findNearbyEnemy(game);
            this.aiTimer = this.aiCheckInterval;
        }

        if (this.attackTarget) {
            if (this.attackTarget.isDead) {
                this.attackTarget = null;
            } else {
                this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime, game);
                this.tryAttack(this.attackTarget, deltaTime);
            }
        }
        else if (this.gatherTarget && this.canGather) {
            if (this.gatherTarget.amount <= 0) {
                this.gatherTarget = null;
            } else {
                this.moveTowardsTarget(this.gatherTarget.x, this.gatherTarget.y, deltaTime, game);
                this.tryGather(this.gatherTarget, deltaTime, game);
            }
        }
        else if (this.targetX !== null) {
            this.moveTowardsTarget(this.targetX, this.targetY, deltaTime, game);
            const dist = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (dist < 10) {
                this.targetX = null;
                this.targetY = null;
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }

    findNearbyEnemy(game) {
        const searchRadius = 200;

        // OPTIMIZACIÓN: Usar Spatial Grid
        const nearbyEntities = game.spatialGrid.query(this.x, this.y, searchRadius);

        for (let entity of nearbyEntities) {
            if (entity.team !== this.team && entity.team !== 'neutral' && !entity.isDead && entity.isUnit) {
                const dist = Math.hypot(this.x - entity.x, this.y - entity.y);
                if (dist < searchRadius) {
                    this.attackTarget = entity;
                    break;
                }
            }
        }
    }

    moveTowardsTarget(targetX, targetY, deltaTime, game) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            // Obtener modificador de terreno
            let speedModifier = 1.0;
            if (game && game.terrainMap) {
                const terrain = game.terrainMap.getTerrainAt(this.x, this.y);
                const terrainData = game.terrainMap.getTerrainData(terrain);
                speedModifier = terrainData.movementSpeed;
            }

            const effectiveSpeed = this.speed * speedModifier;
            let moveX = (dx / dist) * effectiveSpeed * deltaTime;
            let moveY = (dy / dist) * effectiveSpeed * deltaTime;

            // Colisiones con edificios (GridMap)
            if (game && game.gridMap) {
                // Verificar nueva posición propuesta
                const nextX = this.x + moveX;
                const nextY = this.y + moveY;

                const snap = game.gridMap.snapToGrid(nextX, nextY);
                const cellIndex = game.gridMap.getIndex(snap.col, snap.row);

                // Si el índice es válido y hay algo en la celda
                if (cellIndex >= 0 && cellIndex < game.gridMap.grid.length) {
                    const content = game.gridMap.grid[cellIndex];

                    if (content && content.isBuilding) {
                        // Colisión simple: Intentar deslizarse
                        // Verificar movimiento solo en X
                        const snapX = game.gridMap.snapToGrid(this.x + moveX, this.y);
                        const contentX = game.gridMap.grid[game.gridMap.getIndex(snapX.col, snapX.row)];
                        if (contentX && contentX.isBuilding) {
                            moveX = 0;
                        }

                        // Verificar movimiento solo en Y
                        const snapY = game.gridMap.snapToGrid(this.x, this.y + moveY);
                        const contentY = game.gridMap.grid[game.gridMap.getIndex(snapY.col, snapY.row)];
                        if (contentY && contentY.isBuilding) {
                            moveY = 0;
                        }
                    }
                }
            }

            this.x += moveX;
            this.y += moveY;

            this.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH, this.x));
            this.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT, this.y));
        }
    }

    tryAttack(target, deltaTime, game) {
        const dist = Math.hypot(this.x - target.x, this.y - target.y);

        if (dist <= this.attackRange && this.attackCooldown <= 0) {
            let damage = this.attackDamage;

            // Aplicar bonificaciones de terreno si el juego está disponible
            if (game && game.terrainMap) {
                // Bonificación del atacante
                const myTerrain = game.terrainMap.getTerrainAt(this.x, this.y);
                const myTerrainData = game.terrainMap.getTerrainData(myTerrain);

                if (myTerrainData.combatBonus[this.type]) {
                    damage *= myTerrainData.combatBonus[this.type];
                }

                // Bonificación defensiva del objetivo
                const targetTerrain = game.terrainMap.getTerrainAt(target.x, target.y);
                const targetTerrainData = game.terrainMap.getTerrainData(targetTerrain);

                if (targetTerrainData.combatBonus.defense) {
                    damage /= targetTerrainData.combatBonus.defense;
                }

                // Bonificación defensiva específica contra tipo de unidad (ej. arqueros en bosque)
                if (targetTerrainData.combatBonus[target.type]) {
                    // Si el terreno da bonificación al tipo de unidad defensora, reduce el daño recibido
                    // Nota: Esto asume que el bonus en TERRAIN_TYPES es genérico. 
                    // Para simplificar, usaremos la lógica de defensa general o específica si es defensa.
                    // Pero según la config: archer: 1.1 en bosque es defensa.
                    // Vamos a interpretar los valores en combatBonus como multiplicadores de fuerza.
                    // Si es defensa, reduce daño.
                }
            }

            target.takeDamage(damage);
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    tryGather(node, deltaTime, game) {
        const dist = Math.hypot(this.x - node.x, this.y - node.y);

        if (dist <= 30) {
            const gatherAmount = CONFIG.GATHER_RATES[node.type] * deltaTime;
            const actualGather = Math.min(gatherAmount, node.amount);

            node.amount -= actualGather;
            game.resources[node.type] += actualGather;
        }
    }
}

// ==========================================
// UNIDADES ESPECÍFICAS
// ==========================================
class Villager extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '👨‍🌾';
        this.name = 'Aldeano';
        this.type = 'villager';
        this.maxHp = 50;
        this.hp = 50;
        this.attackDamage = 3;
        this.canAttack = true;
        this.canGather = true;

        // Estado y Carga
        this.state = 'IDLE';
        this.carryAmount = 0;
        this.carryType = null;
        this.maxCarry = 10;
        this.gatherTimer = 0;

        // Objetivos
        this.currentResourceNode = null;
        this.dropOffTarget = null;
        this.buildTarget = null;

        // Temporizador para sonidos de trabajo
        this.workTimer = 0;
    }

    update(deltaTime, game) {
        this.aiTimer -= deltaTime;

        switch (this.state) {
            case 'IDLE':
                if (this.carryAmount > 0) this.findDropOffAndGo(game);
                if (this.aiTimer <= 0) {
                    this.findNearbyEnemy(game);
                    this.aiTimer = this.aiCheckInterval;
                }
                break;

            case 'MOVING':
                if (this.targetX !== null) {
                    this.moveTowardsTarget(this.targetX, this.targetY, deltaTime);
                    if (Math.hypot(this.x - this.targetX, this.y - this.targetY) < 5) {
                        this.targetX = null;
                        this.state = 'IDLE';
                    }
                }
                break;

            case 'GATHERING':
                if (!this.currentResourceNode || this.currentResourceNode.amount <= 0) {
                    this.state = 'IDLE';
                    this.currentResourceNode = null;
                    break;
                }
                const distRes = Math.hypot(this.x - this.currentResourceNode.x, this.y - this.currentResourceNode.y);
                if (distRes > 30) {
                    this.moveTowardsTarget(this.currentResourceNode.x, this.currentResourceNode.y, deltaTime);
                } else {
                    this.gatherTimer += deltaTime;
                    if (this.gatherTimer >= 1.0) {
                        this.gatherTimer = 0;
                        const rate = CONFIG.GATHER_RATES[this.currentResourceNode.type];
                        const amount = Math.min(rate, this.currentResourceNode.amount, this.maxCarry - this.carryAmount);
                        this.currentResourceNode.amount -= amount;
                        this.carryAmount += amount;
                        this.carryType = this.currentResourceNode.type;
                        if (this.carryAmount >= this.maxCarry) this.findDropOffAndGo(game);
                    }
                }
                break;

            case 'CARRYING':
                if (!this.dropOffTarget) {
                    this.findDropOffAndGo(game);
                    if (!this.dropOffTarget) {
                        this.state = 'IDLE';
                        break;
                    }
                }
                const distDrop = Math.hypot(this.x - this.dropOffTarget.x, this.y - this.dropOffTarget.y);
                if (distDrop > this.dropOffTarget.size + 10) {
                    this.moveTowardsTarget(this.dropOffTarget.x, this.dropOffTarget.y, deltaTime);
                } else {
                    game.resources[this.carryType] += this.carryAmount;
                    console.log(`💰 Depositado: ${Math.floor(this.carryAmount)} ${this.carryType}`);
                    this.carryAmount = 0;
                    this.carryType = null;
                    if (this.currentResourceNode && this.currentResourceNode.amount > 0) {
                        this.state = 'GATHERING';
                    } else {
                        this.state = 'IDLE';
                    }
                }
                break;

            case 'BUILDING':
                if (!this.buildTarget || !this.buildTarget.isUnderConstruction) {
                    this.state = 'IDLE';
                    this.buildTarget = null;
                    break;
                }
                const distBuild = Math.hypot(this.x - this.buildTarget.x, this.y - this.buildTarget.y);
                if (distBuild > this.buildTarget.size + 20) {
                    this.moveTowardsTarget(this.buildTarget.x, this.buildTarget.y, deltaTime);
                } else {
                    let buildSpeed = 50;
                    if (game && game.civilizationId) buildSpeed *= civilizationManager.getBuildSpeed(game.civilizationId);
                    this.buildTarget.hp += buildSpeed * deltaTime;

                    // Sonido de trabajo periódico
                    this.workTimer += deltaTime;
                    if (this.workTimer >= 1.5) { // Cada 1.5 segundos
                        this.workTimer = 0;
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('buildWork');
                        }
                    }

                    if (this.buildTarget.hp >= this.buildTarget.constructionMaxHp) {
                        this.buildTarget.hp = this.buildTarget.constructionMaxHp;
                        this.buildTarget.isUnderConstruction = false;
                        this.state = 'IDLE';
                        this.buildTarget = null;

                        // Sonido de finalización
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('buildComplete');
                        }

                        if (game) game.showNotification("Edificio completado", "success");
                    }
                }
                break;

            case 'ATTACKING':
                if (this.attackTarget) {
                    if (this.attackTarget.isDead) {
                        this.attackTarget = null;
                        this.state = 'IDLE';
                    } else {
                        this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime);
                        this.tryAttack(this.attackTarget, deltaTime);
                    }
                } else {
                    this.state = 'IDLE';
                }
                break;
        }
    }

    tryGather(node, deltaTime, game) {
        if (this.state !== 'GATHERING' && this.state !== 'CARRYING') {
            this.state = 'GATHERING';
            this.currentResourceNode = node;
            this.targetX = null;
        }
    }

    findDropOffAndGo(game) {
        let nearest = null;
        let minDist = Infinity;
        const dropOffs = game.buildings.filter(b => (b.type === 'townCenter' || b.type === 'storage') && b.team === this.team);
        for (let b of dropOffs) {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = b;
            }
        }
        if (nearest) {
            this.state = 'CARRYING';
            this.dropOffTarget = nearest;
        } else {
            console.warn("No hay depósito disponible");
        }
    }
}

class Warrior extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⚔️';
        this.name = 'Guerrero';
        this.type = 'warrior';
        this.maxHp = 100;
        this.hp = 100;
        this.attackDamage = 10;
        this.attackSpeed = 1.2;
        this.canAttack = true;
    }
}

class Archer extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏹';
        this.name = 'Arquero';
        this.type = 'archer';
        this.maxHp = 60;
        this.hp = 60;
        this.attackDamage = 8;
        this.attackSpeed = 1.5;
        this.attackRange = 100;
        this.canAttack = true;
    }
}

// ==========================================
// CLASE BASE: BUILDING
// ==========================================
class Building extends Entity {
    constructor(x, y, team) {
        super(x, y, team);
        this.isBuilding = true;
        this.isUnderConstruction = false;
        this.constructionMaxHp = 0;
    }
}

// ==========================================
// EDIFICIOS ESPECÍFICOS
// ==========================================
class TownCenter extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏰';
        this.name = 'Centro Urbano';
        this.type = 'townCenter';
        this.maxHp = 2000;
        this.hp = 2000;
        this.size = 60;
    }
}

class House extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏠';
        this.name = 'Casa';
        this.type = 'house';
        this.maxHp = 500;
        this.hp = 500;
        this.size = 30;
    }
}

class Barracks extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⚔️';
        this.name = 'Cuartel';
        this.type = 'barracks';
        this.maxHp = 1200;
        this.hp = 1200;
        this.size = 50;
    }
}

class Storage extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '📦';
        this.name = 'Depósito';
        this.type = 'storage';
        this.maxHp = 800;
        this.hp = 800;
        this.size = 40;
    }
}

class StorageWood extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🌲';
        this.name = 'Depósito de Madera';
        this.type = 'storageWood';
        this.maxHp = 800;
        this.hp = 800;
        this.size = 40;
    }
}

class Market extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏪';
        this.name = 'Mercado';
        this.type = 'market';
        this.maxHp = 1000;
        this.hp = 1000;
        this.size = 45;
    }
}

class Temple extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⛪';
        this.name = 'Templo';
        this.type = 'temple';
        this.maxHp = 1500;
        this.hp = 1500;
        this.size = 55;
    }
}

class Workshop extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🔨';
        this.name = 'Taller';
        this.type = 'workshop';
        this.maxHp = 1100;
        this.hp = 1100;
        this.size = 50;
    }
}

// ==========================================
// GAME LOOP
// ==========================================

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
    lastTime = window.lastTime = currentTime;

    // Usar window.game como referencia principal
    const gameInstance = window.game || game;

    if (gameInstance) {
        gameInstance.update(Math.min(deltaTime, 0.1)); // Limitar delta para evitar saltos grandes
        gameInstance.render();
    }

    requestAnimationFrame(gameLoop);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    if (typeof debugLogger !== 'undefined') {
        debugLogger.start('Iniciando juego', 'game');
        debugLogger.time('Inicialización completa del juego', 'game');
    } else {
        console.log('🚀 Iniciando carga de datos del juego...');
    }

    // 1. Inicializar DataLoader primero
    try {
        await dataLoader.initialize();
        if (typeof debugLogger !== 'undefined') {
            debugLogger.success('DataLoader inicializado', 'game');
        } else {
            console.log('✅ DataLoader inicializado correctamente');
        }

        // Inicializar datos de tecnologías desde DataLoader
        await initializeTechData();
        if (typeof debugLogger !== 'undefined') {
            debugLogger.success('Datos de tecnologías cargados', 'game');
        } else {
            console.log('✅ Datos de tecnologías cargados');
        }
    } catch (error) {
        if (typeof debugLogger !== 'undefined') {
            debugLogger.error('Error crítico inicializando datos', 'game', error, {
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
        } else {
            console.error('❌ Error inicializando datos:', error);
        }
        // Continuar con datos por defecto
    }

    // 2. Iniciar carga de assets en segundo plano
    assetLoader.loadAll();

    // Cargar sonidos
    if (typeof soundManager !== 'undefined') {
        await soundManager.loadAll();
        // Reproducir sonido de inicio inmediatamente al cargar
        const playPromise = soundManager.play('startGame', 0.25);
        if (playPromise) {
            playPromise.catch(() => {
                console.log("🔊 Autoplay bloqueado - esperando interacción del usuario");
                const playOnInteraction = () => {
                    soundManager.play('startGame', 0.25);
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('keydown', playOnInteraction);
                };
                document.addEventListener('click', playOnInteraction, { once: true });
                document.addEventListener('keydown', playOnInteraction, { once: true });
            });
        }
    }

    // 3. Renderizar selección de civilizaciones
    renderCivilizationSelection();

    // Elementos de UI
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    const mapSizeScreen = document.getElementById('mapSizeScreen');
    const civSelectionScreen = document.getElementById('civSelectionScreen');
    const gameScreen = document.getElementById('gameScreen');
    const backToStartButton = document.getElementById('backToStartButton');
    const backToMapSizeButton = document.getElementById('backToMapSizeButton');

    // Crear partículas de fondo
    createParticles();

    // Click en "Comenzar Juego" -> Ir a selección de tamaño de mapa
    // MODIFICADO: Esta logica ha sido movida a main.js para evitar conflictos
    // Se comenta para prevenir que game.js sobrescriba la UI generada por main.js
    /*
    if (startButton) {
        startButton.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            mapSizeScreen.classList.remove('hidden');
            showMapSizeSelection();

            // Sonido de inicio ya se reprodujo al cargar
        });
    } else {
        console.error('❌ startButton no encontrado en el DOM');
    }
    */

    // Volver al inicio desde selección de tamaño
    backToStartButton.addEventListener('click', () => {
        mapSizeScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    // Volver a selección de tamaño desde selección de civ
    if (backToMapSizeButton) {
        backToMapSizeButton.addEventListener('click', () => {
            backToMapSize();
        });
    }

    // Funcion para renderizar tarjetas de civilizacion
    function renderCivSelection() {
        const civGrid = document.getElementById('civGrid');
        civGrid.innerHTML = '';

        const civs = civilizationManager.getAllCivilizations();

        civs.forEach(civ => {
            const card = document.createElement('div');
            card.className = 'civ-card';
            card.style.setProperty('--civ-color', civ.color);

            // Helper for icons (duplicate of global one for local scope)
            const createLocalIcon = (iconPath, alt, size = '64px') => {
                 if (!iconPath) {
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = `font-size:30px;line-height:${size};text-align:center;width:${size};height:${size};`;
                    placeholder.textContent = alt.substring(0, 1);
                    return placeholder;
                }
                if (iconPath.includes('/') || iconPath.includes('.png')) {
                    const img = document.createElement('img');
                    img.src = iconPath;
                    img.alt = alt;
                    img.style.cssText = `width:${size};height:${size};object-fit:contain;`;
                    if (size === '20px') img.style.verticalAlign = 'middle';
                    return img;
                }
                const span = document.createElement('span');
                span.style.fontSize = size === '64px' ? '48px' : '16px';
                span.textContent = iconPath;
                return span;
            };

            // 1. Icon
            const iconDiv = document.createElement('div');
            iconDiv.className = 'civ-icon-large';
            const displayIcon = civ.iconEmoji || civ.icon;
            iconDiv.appendChild(createLocalIcon(displayIcon, civ.name, '64px'));
            card.appendChild(iconDiv);

            // 2. Name
            const h3 = document.createElement('h3');
            h3.textContent = civ.name;
            card.appendChild(h3);

            // 3. Description
            const p = document.createElement('p');
            p.textContent = civ.description;
            card.appendChild(p);

            // 4. Bonuses
            const bonusesDiv = document.createElement('div');
            bonusesDiv.className = 'civ-bonuses';
            const bStrong = document.createElement('strong');
            bStrong.textContent = 'Bonificaciones:';
            bonusesDiv.appendChild(bStrong);

            const ul = document.createElement('ul');
            if (civ.bonuses.buildSpeed > 1) { const li = document.createElement('li'); li.textContent = `Construccion +${Math.round((civ.bonuses.buildSpeed - 1) * 100)}% rapida`; ul.appendChild(li); }
            if (civ.bonuses.buildingHp > 1) { const li = document.createElement('li'); li.textContent = `Edificios +${Math.round((civ.bonuses.buildingHp - 1) * 100)}% HP`; ul.appendChild(li); }
            if (civ.bonuses.unitSpeed > 1) { const li = document.createElement('li'); li.textContent = `Unidades +${Math.round((civ.bonuses.unitSpeed - 1) * 100)}% velocidad`; ul.appendChild(li); }
            if (civ.bonuses.unitAttack > 1) { const li = document.createElement('li'); li.textContent = `Unidades +${Math.round((civ.bonuses.unitAttack - 1) * 100)}% ataque`; ul.appendChild(li); }
            if (civ.bonuses.gatherSpeed > 1) { const li = document.createElement('li'); li.textContent = `Recoleccion +${Math.round((civ.bonuses.gatherSpeed - 1) * 100)}% rapida`; ul.appendChild(li); }
            bonusesDiv.appendChild(ul);
            card.appendChild(bonusesDiv);

            // 5. Unique Unit
            if (civ.uniqueUnit) {
                const uniqueDiv = document.createElement('div');
                uniqueDiv.className = 'civ-bonuses';
                uniqueDiv.style.marginTop = '10px';

                const uStrong = document.createElement('strong');
                uStrong.textContent = 'Unidad Unica:';
                uniqueDiv.appendChild(uStrong);

                const uUl = document.createElement('ul');
                const uLi = document.createElement('li');

                uLi.appendChild(createLocalIcon(civ.uniqueUnit.icon, civ.uniqueUnit.name, '20px'));
                const uText = document.createTextNode(` ${civ.uniqueUnit.name}`);
                uLi.appendChild(uText);

                uUl.appendChild(uLi);
                uniqueDiv.appendChild(uUl);
                card.appendChild(uniqueDiv);
            }

            // Accessibility attributes
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Seleccionar civilización ${civ.name}`);
            // Palette: Custom Tooltip instead of native title
            const tooltip = document.createElement('div');
            tooltip.className = 'card-tooltip';
            tooltip.textContent = `${civ.name}\n${civ.description.substring(0, 100)}${civ.description.length > 100 ? '...' : ''}`;
            card.appendChild(tooltip);

            // Keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startGame(civ.id);
                }
            });

            card.onclick = () => startGame(civ.id);
            civGrid.appendChild(card);
        });
    }

    // Renderizar civilizaciones inicialmente
    renderCivSelection();

    // Iniciar juego con la civilización seleccionada
    function startGame(civId) {
        civSelectionScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        // Iniciar juego
        game = new Game(civId);
        requestAnimationFrame(gameLoop);
    }

    // Restart button
    document.getElementById('restartButton').addEventListener('click', () => {
        location.reload();
    });
});

// Función para crear partículas en el fondo de la pantalla de inicio
function createParticles() {
    const container = document.getElementById('particlesBg');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(212, 175, 55, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s infinite ease-in-out`;
        particle.style.animationDelay = Math.random() * 5 + 's';

        container.appendChild(particle);
    }

    // Añadir animación de flotación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
        }
    `;
    document.head.appendChild(style);
}

// Función global para cerrar el menú de construcción
// Función global para cerrar el menú de construcción
window.closeBuildMenu = function () {
    document.getElementById('buildMenu').classList.add('hidden');
};

// ==========================================
// ÁRBOL DE TECNOLOGÍAS
// ==========================================

window.showTechTree = function () {
    const modal = document.getElementById('techTreeScreen');
    if (!modal) {
        console.error('Tech tree modal not found');
        return;
    }

    modal.classList.remove('hidden');
    renderTechTree();
}

window.hideTechTree = function () {
    const modal = document.getElementById('techTreeScreen');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderTechTree() {
    const content = document.getElementById('techTreeContent');
    if (!content) return;

    content.innerHTML = '';

    // Obtener el estado actual del juego si existe
    const techManager = game ? game.techManager : null;
    const currentAge = techManager ? techManager.currentAge : 1;

    // Header con información de edad actual
    const headerSection = document.createElement('div');
    headerSection.className = 'tech-tree-header';
    headerSection.innerHTML = `
        <div class="current-age-info">
            <h3>📜 Edad Actual: ${AGES[currentAge].name}</h3>
            <p class="age-period">${AGES[currentAge].period} - ${AGES[currentAge].era}</p>
        </div>
        <div class="timeline-legend">
            <div class="legend-item"><span class="legend-color past"></span> Edades Pasadas</div>
            <div class="legend-item"><span class="legend-color current"></span> Edad Actual</div>
            <div class="legend-item"><span class="legend-color future"></span> Edades Futuras</div>
        </div>
    `;
    content.appendChild(headerSection);

    // Categorías de tecnologías
    const categories = [
        { id: 'TOOLS', title: 'Herramientas', icon: '🔨', color: '#8b7355' },
        { id: 'AGRICULTURE', title: 'Agricultura', icon: '🌾', color: '#6a994e' },
        { id: 'ECONOMY', title: 'Economía', icon: '💰', color: '#d4af37' },
        { id: 'ARCHITECTURE', title: 'Arquitectura', icon: '🏛️', color: '#a8a29e' },
        { id: 'MILITARY', title: 'Militar', icon: '⚔️', color: '#c53030' },
        { id: 'DEFENSE', title: 'Defensa', icon: '🛡️', color: '#3182ce' },
        { id: 'CULTURE', title: 'Cultura', icon: '📚', color: '#805ad5' }
    ];

    // Container principal horizontal
    const horizontalTimeline = document.createElement('div');
    horizontalTimeline.className = 'horizontal-timeline';

    // Crear timeline horizontal por edades
    for (let age = 1; age <= 30; age++) {
        const ageColumn = document.createElement('div');
        ageColumn.className = 'age-column';

        const ageInfo = AGES[age];
        const isCurrentAge = age === currentAge;
        const isPastAge = age < currentAge;
        const isFutureAge = age > currentAge;

        // Header de la edad
        const ageHeader = document.createElement('div');
        ageHeader.className = `age-column-header ${isCurrentAge ? 'current' : ''} ${isPastAge ? 'past' : ''} ${isFutureAge ? 'future' : ''}`;
        ageHeader.innerHTML = `
            <div class="age-number-badge">${age}</div>
            <div class="age-info">
                <div class="age-name-short">${ageInfo.name}</div>
                <div class="age-period-short">${ageInfo.period}</div>
            </div>
        `;
        ageColumn.appendChild(ageHeader);

        // Contenedor de tecnologías por categoría
        const techContainer = document.createElement('div');
        techContainer.className = 'age-tech-container';

        categories.forEach(category => {
            const categoryTechs = Object.values(TECHNOLOGIES).filter(
                t => t.category === TECH_CATEGORIES[category.id] && t.age === age
            );

            if (categoryTechs.length > 0) {
                const categoryRow = document.createElement('div');
                categoryRow.className = 'tech-category-row';
                categoryRow.style.borderLeftColor = category.color;

                categoryTechs.forEach(tech => {
                    const techCard = createCompactTechCard(tech, techManager, category.color);
                    categoryRow.appendChild(techCard);
                });

                techContainer.appendChild(categoryRow);
            }
        });

        ageColumn.appendChild(techContainer);
        horizontalTimeline.appendChild(ageColumn);
    }

    content.appendChild(horizontalTimeline);

    // Auto-scroll a la edad actual
    setTimeout(() => {
        const currentAgeColumn = horizontalTimeline.querySelector('.age-column-header.current');
        if (currentAgeColumn) {
            currentAgeColumn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

// Nueva función para crear tarjetas compactas en timeline horizontal
function createCompactTechCard(tech, techManager, categoryColor) {
    const card = document.createElement('div');
    card.className = 'tech-card-compact';

    // Determinar el estado de la tecnología
    let status = 'available';
    let statusIcon = '';

    if (techManager) {
        if (techManager.isResearched(tech.id)) {
            status = 'researched';
            statusIcon = '✓';
        } else if (techManager.isLocked(tech.id)) {
            status = 'locked';
            statusIcon = '🔒';
        } else if (techManager.isResearching(tech.id)) {
            status = 'researching';
            statusIcon = '⏳';
        }
    }

    card.setAttribute('data-status', status);
    card.style.borderTopColor = categoryColor;

    // Generar string de costos compacto
    let costHTML = '';
    const costIcons = { food: '🌾', wood: '🪵', gold: '💰', stone: '🪨' };
    for (let [resource, amount] of Object.entries(tech.cost)) {
        const icon = costIcons[resource] || resource;
        costHTML += `<span class="cost-mini">${icon}${amount}</span>`;
    }

    card.innerHTML = `
        <div class="tech-icon-compact">${tech.icon}</div>
        <div class="tech-name-compact" title="${tech.name}">${tech.name}</div>
        ${statusIcon ? `<div class="tech-status-icon">${statusIcon}</div>` : ''}
        <div class="tech-cost-compact">${costHTML}</div>
    `;

    // Tooltip con información completa
    card.title = `${tech.name}\n${tech.description}\nTiempo: ${tech.researchTime}s`;

    // Mostrar prerequisitos si existen
    if (tech.prerequisites && tech.prerequisites.length > 0) {
        const prereqNames = tech.prerequisites.map(id => {
            const prereqTech = TECHNOLOGIES[id];
            return prereqTech ? prereqTech.name : id;
        }).join(', ');
        card.title += `\nRequiere: ${prereqNames}`;
    }

    return card;
}

function getRomanNumeral(num) {
    const numerals = ['', 'I', 'II', 'III', 'IV', 'V'];
    return numerals[num] || num;
}

// Funciones para selección de tamaño de mapa
window.showMapSizeSelection = function () {
    const mapSizeGrid = document.getElementById('mapSizeGrid');
    if (!mapSizeGrid) return;

    mapSizeGrid.innerHTML = '';

    for (let [key, mapSize] of Object.entries(MAP_SIZES)) {
        const card = document.createElement('div');
        card.className = 'map-size-card';
        card.setAttribute('data-size', key);

        const isRecommended = key === 'normal';

        card.innerHTML = `
            <div class="map-size-icon">🗺️</div>
            <div class="map-size-name">${mapSize.name}</div>
            <div class="map-size-info">${mapSize.tiles}×${mapSize.tiles} tiles</div>
            ${isRecommended ? '<div class="map-size-badge">Recomendado</div>' : ''}
        `;

        // Accessibility attributes
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Seleccionar mapa ${mapSize.name} (${mapSize.tiles} por ${mapSize.tiles} casillas)`);

        // Tooltip description
        let sizeDesc = '';
        if (mapSize.tiles <= 144) sizeDesc = 'Mapa rápido para partidas cortas.';
        else if (mapSize.tiles <= 200) sizeDesc = 'Tamaño estándar equilibrado.';
        else sizeDesc = 'Mapa extenso para partidas largas.';

        // Palette: Custom Tooltip instead of native title
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.textContent = `${mapSize.name}: ${mapSize.tiles}x${mapSize.tiles} casillas.\n${sizeDesc}`;
        card.appendChild(tooltip);

        // Keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        card.addEventListener('click', () => selectMapSize(key));
        mapSizeGrid.appendChild(card);
    }
}

window.selectMapSize = function (sizeKey) {
    const mapSize = MAP_SIZES[sizeKey];
    if (!mapSize) return;

    // Actualizar CONFIG
    CONFIG.CANVAS_WIDTH = mapSize.width;
    CONFIG.CANVAS_HEIGHT = mapSize.height;
    CONFIG.CURRENT_MAP_SIZE = sizeKey;

    // Ocultar pantalla de selección de tamaño
    document.getElementById('mapSizeScreen').classList.add('hidden');

    // Mostrar pantalla de selección de civilización
    document.getElementById('civSelectionScreen').classList.remove('hidden');

    console.log(`Mapa seleccionado: ${mapSize.name} (${mapSize.tiles}×${mapSize.tiles})`);
}

window.backToMapSize = function () {
    document.getElementById('civSelectionScreen').classList.add('hidden');
    document.getElementById('mapSizeScreen').classList.remove('hidden');
}

// ==========================================
// FUNCIÓN DE CONFIGURACIÓN - Toggle Grid
// ==========================================
window.toggleGrid = function () {
    let newState = false;
    if (game) {
        game.showGrid = !game.showGrid;
        newState = game.showGrid;
        const toggleElement = document.getElementById('gridToggleValue');
        if (toggleElement) {
            toggleElement.textContent = newState ? 'Activada' : 'Desactivada';
            toggleElement.style.color = newState ? '#48bb78' : '#f56565';
        }
    }

    // ACCESIBILIDAD: Actualizar estado visual y semántico
    const btn = document.getElementById('gridToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', newState);
}

window.showSettings = function () {
    const modal = document.getElementById('settingsScreen');
    if (modal) {
        modal.classList.remove('hidden');
        // Actualizar estado actual
        const gridToggleElement = document.getElementById('gridToggleValue');
        if (gridToggleElement && game) {
            gridToggleElement.textContent = game.showGrid ? 'Activada' : 'Desactivada';
            gridToggleElement.style.color = game.showGrid ? '#48bb78' : '#f56565';
        }
        const gridBtn = document.getElementById('gridToggleBtn');
        if (gridBtn && game) gridBtn.setAttribute('aria-pressed', game.showGrid);

        // Sincronizar toggle de aldeanos inactivos
        const idleToggleElement = document.getElementById('idleVillagerToggleValue');
        if (idleToggleElement && game) {
            idleToggleElement.textContent = game.enableIdleVillagerCycle ? 'Activado' : 'Desactivado';
            idleToggleElement.style.color = game.enableIdleVillagerCycle ? '#48bb78' : '#f56565';
        }
        const idleBtn = document.getElementById('idleVillagerToggleBtn');
        if (idleBtn && game) idleBtn.setAttribute('aria-pressed', game.enableIdleVillagerCycle);

        // Sincronizar sliders de cámara
        if (game && game.cameraConfig) {
            const speedSlider = document.getElementById('cameraSpeedSlider');
            const marginSlider = document.getElementById('cameraMarginSlider');
            const speedValue = document.getElementById('cameraSpeedValue');
            const marginValue = document.getElementById('cameraMarginValue');

            if (speedSlider) {
                speedSlider.value = game.cameraConfig.edgeSpeed;
                speedValue.textContent = `${game.cameraConfig.edgeSpeed} px/s`;
            }
            if (marginSlider) {
                marginSlider.value = game.cameraConfig.edgeThreshold;
                marginValue.textContent = `${game.cameraConfig.edgeThreshold} px`;
            }
        }

        // Sincronizar controles de sonido
        if (typeof soundManager !== 'undefined') {
            const soundToggleElement = document.getElementById('soundToggleValue');
            const volumeSlider = document.getElementById('volumeSlider');
            const volumeValue = document.getElementById('volumeValue');

            if (soundToggleElement) {
                soundToggleElement.textContent = soundManager.enabled ? 'Activado' : 'Desactivado';
                soundToggleElement.style.color = soundManager.enabled ? '#48bb78' : '#f56565';
            }

            if (volumeSlider) {
                volumeSlider.value = soundManager.volume * 100;
            }

            if (volumeValue) {
                volumeValue.textContent = `${Math.round(soundManager.volume * 100)}%`;
            }
        }
    }
}

window.updateCameraSpeed = function (value) {
    const speed = parseInt(value);
    document.getElementById('cameraSpeedValue').textContent = `${speed} px/s`;
    if (game && game.cameraConfig) {
        game.cameraConfig.edgeSpeed = speed;
    }
}

window.updateCameraMargin = function (value) {
    const margin = parseInt(value);
    document.getElementById('cameraMarginValue').textContent = `${margin} px`;
    if (game && game.cameraConfig) {
        game.cameraConfig.edgeThreshold = margin;
    }
}

window.hideSettings = function () {
    const modal = document.getElementById('settingsScreen');
    if (modal) {
        modal.classList.add('hidden');
    }
}

window.toggleIdleVillagerCycle = function () {
    let newState = false;
    if (game) {
        game.enableIdleVillagerCycle = !game.enableIdleVillagerCycle;
        newState = game.enableIdleVillagerCycle;

        const toggleElement = document.getElementById('idleVillagerToggleValue');
        if (toggleElement) {
            toggleElement.textContent = newState ? 'Activado' : 'Desactivado';
            toggleElement.style.color = newState ? '#48bb78' : '#f56565';
        }
    }

    // ACCESIBILIDAD: Actualizar estado visual y semántico
    const btn = document.getElementById('idleVillagerToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', newState);
}

// ==========================================
// CONTROL DE SONIDO
// ==========================================
// ==========================================
// CONTROL DE SONIDO
// ==========================================
window.toggleSound = function () {
    console.log('🔊 Toggle Sound llamado');
    let newState = false;

    if (typeof soundManager !== 'undefined') {
        soundManager.setEnabled(!soundManager.enabled);
        newState = soundManager.enabled;

        const toggleElement = document.getElementById('soundToggleValue');
        if (toggleElement) {
            toggleElement.textContent = newState ? 'Activado' : 'Desactivado';
            toggleElement.style.color = newState ? '#48bb78' : '#f56565';
        }
    } else {
        console.error('❌ soundManager no está definido');
    }

    // Update ARIA
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', newState);
};

window.updateSoundVolume = function (value) {
    // console.log('🔊 Update Volume:', value); // Comentado para no spammear
    const volume = parseInt(value) / 100;
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) {
        volumeValue.textContent = `${value}%`;
    }

    if (typeof soundManager !== 'undefined') {
        soundManager.setVolume(volume);
    } else {
        console.error('❌ soundManager no está definido');
    }
};

// ==========================================
// SELECCION DE CIVILIZACION Y START GAME
// ==========================================

/**
 * Helper function to render an icon as img or fallback
 * Returns a DOM element instead of HTML string for security
 */
function createSafeIconElement(iconPath, alt = '', size = '64px') {
    if (!iconPath) {
        const placeholder = document.createElement('div');
        placeholder.className = 'civ-icon-placeholder';
        placeholder.style.cssText = `font-size:30px;line-height:${size};text-align:center;width:${size};height:${size};`;
        placeholder.textContent = alt.substring(0, 1);
        return placeholder;
    }

    // Check if it's an image path
    if (iconPath.includes('/') || iconPath.includes('.png') || iconPath.includes('.jpg') || iconPath.includes('.svg')) {
        const img = document.createElement('img');
        img.src = iconPath;
        img.alt = alt; // Secure as attribute
        img.className = 'civ-icon-img';
        img.style.cssText = `width:${size};height:${size};object-fit:contain;`;
        img.onerror = function() { this.style.display = 'none'; };
        return img;
    }

    // Return as-is for emojis (safe text)
    const span = document.createElement('span');
    span.style.fontSize = '48px';
    span.textContent = iconPath;
    return span;
}

function renderCivilizationSelection() {
    const civGrid = document.getElementById('civGrid');
    if (!civGrid) return;

    civGrid.innerHTML = '';
    const civilizaciones = dataLoader.getAllCivilizations();

    if (civilizaciones.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'color:white; text-align:center;';
        p.textContent = 'No se pudieron cargar las civilizaciones.';
        civGrid.appendChild(p);
        return;
    }

    civilizaciones.forEach(civ => {
        const card = document.createElement('div');
        card.className = 'civ-card';

        // 1. Icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'civ-icon';
        iconDiv.appendChild(createSafeIconElement(civ.icon, civ.name, '64px'));
        card.appendChild(iconDiv);

        // 2. Name
        const nameH3 = document.createElement('h3');
        nameH3.className = 'civ-name';
        nameH3.textContent = civ.name; // Safe against XSS
        card.appendChild(nameH3);

        // 3. Description
        const descDiv = document.createElement('div');
        descDiv.className = 'civ-description';
        descDiv.textContent = civ.description; // Safe against XSS
        card.appendChild(descDiv);

        // 4. Unique Unit
        if (civ.uniqueUnit) {
            const unitDiv = document.createElement('div');
            unitDiv.className = 'civ-unique-unit';

            const strong = document.createElement('strong');
            strong.textContent = 'Unidad Unica: ';
            unitDiv.appendChild(strong);

            unitDiv.appendChild(createSafeIconElement(civ.uniqueUnit.icon, civ.uniqueUnit.name, '24px'));

            const unitNameText = document.createTextNode(` ${civ.uniqueUnit.name}`);
            unitDiv.appendChild(unitNameText);

            card.appendChild(unitDiv);
        }

        // 5. Bonuses
        const bonusesUl = document.createElement('ul');
        bonusesUl.className = 'civ-bonuses';

        if (civ.bonuses && typeof civ.bonuses === 'object') {
            const bonusDescriptions = {
                buildSpeed: 'Velocidad de construccion',
                buildingHp: 'HP de edificios',
                agricultureBonus: 'Bonus agricola',
                gatherRate: 'Velocidad de recoleccion',
                militaryBonus: 'Bonus militar'
            };

            Object.entries(civ.bonuses).forEach(([key, value]) => {
                const li = document.createElement('li');
                const label = bonusDescriptions[key] || key;
                const percent = ((value - 1) * 100).toFixed(0);
                li.textContent = `${label}: +${percent}%`;
                bonusesUl.appendChild(li);
            });
        }
        card.appendChild(bonusesUl);

        // 6. Select Button
        const btn = document.createElement('button');
        btn.className = 'btn-select-civ';
        btn.setAttribute('tabindex', '-1');
        btn.textContent = 'Seleccionar';
        card.appendChild(btn);

        // Accessibility attributes
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Seleccionar civilización ${civ.name}`);
        // Palette: Custom Tooltip instead of native title
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.textContent = `${civ.name}\n${civ.description.substring(0, 100)}${civ.description.length > 100 ? '...' : ''}`;
        card.appendChild(tooltip);

        // Keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        card.addEventListener('click', () => selectCivilization(civ));
        civGrid.appendChild(card);
    });
}

function selectCivilization(civilization) {
    console.log(`👑 Civilización seleccionada: ${civilization.name}`);

    // Ocultar pantalla de selección
    document.getElementById('civSelectionScreen').classList.add('hidden');

    // Mostrar pantalla de juego
    document.getElementById('gameScreen').classList.remove('hidden');

    // Iniciar el juego
    startGame(civilization);
}

function startGame(civilization) {
    const canvas = document.getElementById('gameCanvas');

    // Configurar canvas
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;

    // Inicializar juego
    // Inicializar juego
    // Game constructor espera: (civId, mapConfig)
    // civilization es el objeto completo, necesitamos su ID
    game = window.game = new Game(civilization.id);
    console.log('🎮 Game creado y asignado:', typeof game, typeof window.game);
    console.log('🎮 openBuildMenu existe:', typeof game.openBuildMenu);

    // Iniciar loop
    lastTime = window.lastTime = performance.now();
    requestAnimationFrame(gameLoop);


    // Sonido de inicio ya se reprodujo al cargar
}

// ==========================================
// FUNCIÓN GLOBAL PARA CERRAR MENÚ DE CONSTRUCCIÓN
// ==========================================
function closeBuildMenu() {
    const buildMenu = document.getElementById('buildMenu');
    if (buildMenu) {
        buildMenu.classList.add('hidden');
        console.log('🚪 Menú de construcción cerrado');
    }
}
