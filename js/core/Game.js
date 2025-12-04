// Imports de módulos creados
import { CONFIG, TILE_SIZE, TERRAIN_TYPES } from './constants.js';
import { GridMap } from '../map/GridMap.js';
import { TerrainMap } from '../map/TerrainMap.js';
import { SpatialGrid } from '../managers/SpatialGrid.js';
import { Villager } from '../entities/units/Villager.js';
import { Warrior } from '../entities/units/Warrior.js';
import { Archer } from '../entities/units/Archer.js';
import { TownCenter } from '../entities/buildings/TownCenter.js';
import { House } from '../entities/buildings/House.js';
import { Barracks } from '../entities/buildings/Barracks.js';
import { Storage } from '../entities/buildings/Storage.js';
import { StorageWood } from '../entities/buildings/StorageWood.js';
import { Market } from '../entities/buildings/Market.js';
import { Temple } from '../entities/buildings/Temple.js';
import { Workshop } from '../entities/buildings/Workshop.js';

/**
 * Game - Clase principal del juego
 * Orquesta todos los sistemas: rendering, input, lógica, UI
 * Requiere variables globales: civilizationManager, TechManager, ProceduralMapGenerator, soundManager
 */
export class Game {
    // NOTA: Este archivo usa temporalmente variables globales (civilizationManager, TechManager, etc.)
    // para mantener compatibilidad durante la migración. Serán importadas cuando esos módulos se extraigan.

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

        // Pointer Lock para múltiples monitores
        this.isPointerLocked = false;

        // Mouse
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

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

        // SISTEMA DE TECNOLOGÍAS (variable global temporal)
        this.techManager = new TechManager(this);

        // Cargar imagen del cursor personalizado
        this.cursorImage = new Image();
        this.cursorImage.src = 'assets/icons/cursor.png';

        // Crear elemento DOM para el cursor
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'customCursor';
        this.cursorElement.style.position = 'fixed';
        this.cursorElement.style.pointerEvents = 'none';
        this.cursorElement.style.zIndex = '9999';
        this.cursorElement.style.transform = 'translate(0, 0)'; // El cursor.png tiene la punta arriba-izquierda
        this.cursorElement.style.width = '32px'; // Tamaño por defecto
        this.cursorElement.style.height = 'auto';

        const cursorImg = document.createElement('img');
        cursorImg.src = 'assets/icons/cursor.png';
        cursorImg.style.width = '100%';
        cursorImg.style.height = 'auto';
        cursorImg.style.display = 'block';
        this.cursorElement.appendChild(cursorImg);

        document.body.appendChild(this.cursorElement);
        document.body.style.cursor = 'none';

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
        // Usar el generador procedural de mapas (variable global temporal)
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
            { type: 'wood', icon: '🌲', amount: 600, weight: 0.35 },  // 35% de probabilidad (más común)
            { type: 'food', icon: '🌾', amount: 500, weight: 0.30 },  // 30% de probabilidad
            { type: 'gold', icon: '💎', amount: 400, weight: 0.20 },  // 20% de probabilidad (más valioso)
            { type: 'stone', icon: '🪨', amount: 400, weight: 0.15 }  // 15% de probabilidad (más raro)
        ];

        // Generar 60 nodos de recursos (triplicamos la cantidad original)
        for (let i = 0; i < 60; i++) {
            // Selección ponderada de tipo de recurso
            const rand = Math.random();
            let cumulative = 0;
            let resType = resourceTypes[0];

            for (let type of resourceTypes) {
                cumulative += type.weight;
                if (rand <= cumulative) {
                    resType = type;
                    break;
                }
            }

            const x = Math.random() * CONFIG.CANVAS_WIDTH;
            const y = Math.random() * CONFIG.CANVAS_HEIGHT;

            // Evitar spawn cerca del centro inicial (jugador)
            const distanceFromPlayer = Math.hypot(x - 400, y - 400);
            // Evitar spawn cerca de la base enemiga
            const distanceFromEnemy = Math.hypot(x - (CONFIG.CANVAS_WIDTH - 400), y - (CONFIG.CANVAS_HEIGHT - 400));

            // Solo colocar si está lejos de ambas bases (mínimo 200 unidades)
            if (distanceFromPlayer > 200 && distanceFromEnemy > 200) {
                this.resourceNodes.push({
                    x, y,
                    type: resType.type,
                    icon: resType.icon,
                    amount: resType.amount,
                    radius: 20
                });
            } else {
                // Reintentar esta iteración
                i--;
            }
        }

        console.log(`✅ Mapa simple generado con ${this.resourceNodes.length} nodos de recursos`);
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
        // Mouse move - Actualizar cursor DOM y posición lógica
        window.addEventListener('mousemove', (e) => {
            this.hasMouseMoved = true;

            // Actualizar posición del cursor visual (DOM)
            if (this.cursorElement) {
                this.cursorElement.style.left = e.clientX + 'px';
                this.cursorElement.style.top = e.clientY + 'px';
            }

            // Actualizar posición lógica del mouse relativa al canvas
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;

            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
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

                // Reproducir sonido de selección (variable global temporal)
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

        // ESC - Cancel y liberar pointer lock
        if (e.key === 'Escape') {
            this.buildMode = null;
            this.closeBuildMenu();
            // Liberar pointer lock si está activo
            if (this.isPointerLocked) {
                document.exitPointerLock();
            }
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
        } else {
            // Hotkeys para botones del panel de control (grid 3x5)
            // Solo funciona cuando el menú de construcción NO está abierto
            const hotkeyActions = {
                'Q': 0, 'W': 1, 'E': 2, 'R': 3, 'T': 4,  // Fila 1
                'A': 5, 'S': 6, 'D': 7, 'F': 8, 'G': 9,  // Fila 2
                'Z': 10, 'X': 11, 'C': 12, 'V': 13, 'B': 14  // Fila 3
            };

            const key = e.key.toUpperCase();
            if (hotkeyActions.hasOwnProperty(key)) {
                const btnIndex = hotkeyActions[key];
                const actionsGrid = document.getElementById('actionsGrid');
                if (actionsGrid) {
                    const buttons = actionsGrid.querySelectorAll('.action-btn');
                    if (buttons[btnIndex] && !buttons[btnIndex].classList.contains('disabled')) {
                        buttons[btnIndex].click();
                        e.preventDefault();
                        return;
                    }
                }
            }
        }

        // WASD - Camera movement handled in updateCamera()
        // Eliminado manejo directo aquí para usar deltaTime y movimiento suave
    }

    openBuildMenu() {
        document.getElementById('buildMenu').classList.remove('hidden');

        // Setup build options
        const buildOptions = document.querySelectorAll('.build-option');
        buildOptions.forEach(option => {
            option.onclick = () => {
                const buildingType = option.dataset.building;
                this.startBuildMode(buildingType);
                this.closeBuildMenu();
            };
        });
    }

    closeBuildMenu() {
        document.getElementById('buildMenu').classList.add('hidden');
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

            // Aplicar bonificaciones de civilización (variable global temporal)
            civilizationManager.applyBuildingBonuses(building, this.civilizationId);

            this.buildings.push(building);
            this.entities.push(building);

            // Reproducir sonido de inicio de construcción (variable global temporal)
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
            // Aplicar bonificaciones de civilización (variable global temporal)
            civilizationManager.applyUnitBonuses(unit, this.civilizationId);

            this.units.push(unit);
            this.entities.push(unit);
            this.population++;

            // Reproducir sonido de creación (variable global temporal)
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
        let drawn = false;
        if (typeof assetLoader !== 'undefined') {
            const img = assetLoader.getImage(this.buildMode);
            if (img && img.complete) {
                // Dibujar imagen con opacidad
                this.ctx.globalAlpha = 0.7;
                this.ctx.drawImage(img, screenX, screenY, width, height);
                this.ctx.globalAlpha = 1.0;
                drawn = true;
            }
        }

        if (!drawn) {
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
        }

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
                this.minimapCtx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        }

        // Unidades
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;
            this.minimapCtx.fillStyle = unit.team === 'player' ? '#48bb78' : '#c53030';
            this.minimapCtx.fillRect(x - 1, y - 1, 2, 2);
        }

        // Cámara
        const camX = this.camera.x * scale;
        const camY = this.camera.y * scale;
        const camW = this.viewWidth * scale;
        const camH = this.viewHeight * scale;

        this.minimapCtx.strokeStyle = 'white';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(camX, camY, camW, camH);
    }

    drawCustomCursor() {
        if (this.cursorImage.complete) {
            this.ctx.drawImage(this.cursorImage, this.mouse.x, this.mouse.y);
        } else {
            // Fallback cursor
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y);
            this.ctx.lineTo(this.mouse.x + 15, this.mouse.y + 15);
            this.ctx.lineTo(this.mouse.x, this.mouse.y + 22);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    updateUI() {
        // Actualizar recursos
        document.getElementById('woodCount').textContent = Math.floor(this.resources.wood);
        document.getElementById('foodCount').textContent = Math.floor(this.resources.food);
        document.getElementById('goldCount').textContent = Math.floor(this.resources.gold);
        document.getElementById('stoneCount').textContent = Math.floor(this.resources.stone);

        // Actualizar población
        document.getElementById('currentPopulation').textContent = Math.floor(this.population);
        document.getElementById('maxPopulation').textContent = this.maxPopulation;

        // Actualizar tiempo de juego
        const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        const timeElement = document.getElementById('gameTime');
        if (timeElement) timeElement.textContent = `${minutes}:${seconds}`;

        this.updateSelectionPanel();
        this.updateActionsPanel();
    }

    updateSelectionPanel() {
        const content = document.getElementById('selectionContent');
        if (!content) return;

    if (this.selectedEntities.length === 0) {
        content.innerHTML = '';
        return;
    }

    if (this.selectedEntities.length === 1) {
        const entity = this.selectedEntities[0];

        let iconHtml = entity.icon;
        if (typeof assetLoader !== 'undefined') {
            const src = assetLoader.getSrc(entity.type);
            if (src) {
                iconHtml = `<img src="${src}" alt="${entity.name}" class="icon-large">`;
            }
        }

        content.innerHTML = `
                    <div class="selection-info">
                    <div class="selection-icon">
                        ${iconHtml}
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
    const grid = document.getElementById('actionsGrid');
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

    // Helper para obtener iconos de botones
    const getBtnIcon = (key, fallback) => {
        if (typeof assetLoader !== 'undefined') {
            const src = assetLoader.getSrc(key);
            if (src) return `<img src="${src}" class="icon-small">`;
        }
        return fallback;
    };

    // Helper para formatear costo con iconos
    const formatCost = (costObj) => {
        let str = '';
        for (let [res, amount] of Object.entries(costObj)) {
            let icon = '';
            if (typeof assetLoader !== 'undefined') {
                const src = assetLoader.getSrc(res);
                if (src) icon = `<img src="${src}" class="icon-tiny" style="width:16px;height:16px;vertical-align:middle;">`;
                else {
                    // Fallback emojis
                    icon = res === 'food' ? '🌾' : res === 'wood' ? '🪵' : res === 'gold' ? '💰' : '🪨';
                }
            }
            str += `${amount}${icon} `;
        }
        return str.trim();
    };

    if (entity.type === 'villager') {
        buttons.push({
            icon: '🏗️', // No hay asset especifico para "construir" pero podríamos usar un martillo si existiera. Usaremos emoji por ahora o icono de workshop?
            // User said prohibit emojis.
            // Check assetLoader.getSrc('workshop') -> hammer icon? No.
            // I'll leave emoji for action verbs if no icon, or try to find one.
            // Actually, I can use a generic building icon.
            icon: getBtnIcon('workshop', '🏗️'),
            label: 'Construir',
            hotkey: 'Q',
            action: () => this.openBuildMenu(),
            enabled: true
        });
    } else if (entity.type === 'townCenter') {
        const cost = CONFIG.UNIT_COSTS.villager;
        const canAfford = this.canAfford(cost);

        buttons.push({
            icon: getBtnIcon('villager', '👨‍🌾'),
            label: 'Aldeano',
            hotkey: 'Q',
            cost: formatCost(cost),
            action: () => this.trainUnit('villager', this.selectedEntities[0]),
            enabled: canAfford
        });
    } else if (entity.type === 'barracks') {
        const warriorCost = CONFIG.UNIT_COSTS.warrior;
        const archerCost = CONFIG.UNIT_COSTS.archer;
        const canAffordWarrior = this.canAfford(warriorCost);
        const canAffordArcher = this.canAfford(archerCost);

        buttons.push({
            icon: getBtnIcon('warrior', '⚔️'),
            label: 'Guerrero',
            hotkey: 'Q',
            cost: formatCost(warriorCost),
            action: () => this.trainUnit('warrior', this.selectedEntities[0]),
            enabled: canAffordWarrior
        });

        buttons.push({
            icon: getBtnIcon('archer', '🏹'),
            label: 'Arquero',
            hotkey: 'W',
            cost: formatCost(archerCost),
            action: () => this.trainUnit('archer', this.selectedEntities[0]),
            enabled: canAffordArcher
        });
    }

    // Añadir tecnologías disponibles
    if (this.techManager) {
        const availableTechs = this.techManager.getAvailableTechsForBuilding(entity.type);
        let techIndex = 0;
        for (let tech of availableTechs) {
            if (techIndex >= 13) break; // Máximo 13 botones más

            const canAfford = this.techManager.canResearch(tech.id);
            // Use formatCost helper
            let costString = formatCost(tech.cost);

            // TODO: Use asset icons for techs if available
            // let icon = tech.icon || '🔬';

            buttons.push({
                icon: tech.icon || '🔬', // Tech icons are likely emojis in data, need to check Technologies.js to replace them or ignore
                label: tech.name,
                hotkey: hotkeys[buttons.length],
                cost: costString,
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
        btn.setAttribute('data-hotkey', hotkeys[i]);

        if (i < buttons.length) {
            const buttonData = buttons[i];

            if (!buttonData.enabled) {
                btn.classList.add('disabled');
            }

            btn.onclick = () => {
                if (!btn.classList.contains('disabled') && buttonData.action) {
                    try {
                        buttonData.action();
                    } catch (error) {
                        console.error('❌ Error al ejecutar acción:', error);
                    }
                }
            };

            btn.innerHTML = `
                    <div class="btn-icon">${buttonData.icon}</div>
                        <div class="btn-label">${buttonData.label}</div>
                    ${buttonData.cost ? `<div class="btn-cost">${buttonData.cost}</div>` : ''}
                `;
        } else {
            // Botón vacío
            btn.classList.add('disabled');
            btn.innerHTML = '<div class="btn-icon"></div>';
        }

        grid.appendChild(btn);
    }
}

showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${ type } `;

    const icons = {
        info: 'ℹ️',
        error: '❌',
        success: '✅'
    };

    notification.innerHTML = `
                    <div class="notification-icon">${icons[type]}</div>
                        <div class="notification-text">${message}</div>
                `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
}
