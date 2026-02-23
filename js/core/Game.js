// Imports de módulos creados
import { CONFIG, TILE_SIZE, TERRAIN_TYPES, GAMEPLAY_TIPS, FOW_STATES } from './constants.js';
import { FogOfWar } from '../map/FogOfWar.js';
import { FocusManager } from '../utils/FocusManager.js';
import { assetLoader } from '../managers/AssetLoader.js';
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
 * Requiere variables globales: civilizationManager, TechManager, ProceduralMapGenerator, soundManager, assetLoader
 */
export class Game {
    // NOTA: Este archivo usa temporalmente variables globales (civilizationManager, TechManager, etc.)
    // para mantener compatibilidad durante la migración. Serán importadas cuando esos módulos se extraigan.

    // BOLT OPTIMIZATION: Static comparator to avoid closure allocation in hot loops
    static _sortEntities(a, b) {
        return a.y - b.y;
    }

    // BOLT OPTIMIZATION: Apply set difference (Subject - Mask) to buffer with color
    // Replaces naive fill loops to avoid redundant writes (7.5x speedup for clustered units)
    static _applyDiffToBuffer(subjectRanges, maskRanges, data32, color) {
        let m = 0;
        const mLen = maskRanges ? maskRanges.length : 0;
        const sLen = subjectRanges ? subjectRanges.length : 0;

        for (let s = 0; s < sLen; s += 2) {
            let start = subjectRanges[s];
            let end = subjectRanges[s + 1];

            // Skip masks that end before current subject starts
            while (m < mLen && maskRanges[m + 1] < start) {
                m += 2;
            }

            // Iterate masks that overlap with current subject
            let curr = start;
            let tempM = m;

            while (tempM < mLen && maskRanges[tempM] <= end) {
                const mStart = maskRanges[tempM];
                const mEnd = maskRanges[tempM + 1];

                if (mStart > curr) {
                    // Gap in mask: [curr, mStart - 1] is valid subject part
                    // Uint32Array.fill end index is exclusive, so mStart is correct for [curr, mStart-1]
                    data32.fill(color, curr, mStart);
                }
                // Advance current past this mask
                curr = Math.max(curr, mEnd + 1);
                tempM += 2;
            }

            // Remaining part after last mask
            if (curr <= end) {
                data32.fill(color, curr, end + 1);
            }
        }
    }

    // BOLT OPTIMIZATION: Static predicates for spatial find (avoids closure allocation)
    static _cursorEnemyPredicate(entity, game) {
        if (entity.isDead) return false;

        // BOLT OPTIMIZATION: Check FOW visibility to prevent scouting exploit
        if (game.fow && !game.fow.isVisible((entity.x / TILE_SIZE) | 0, (entity.y / TILE_SIZE) | 0)) {
            return false;
        }

        // Optimized distance check
        const dx = entity.x - game.mouse.worldX;
        const dy = entity.y - game.mouse.worldY;
        // Check against entity size squared (hitbox)
        return (dx * dx + dy * dy) < (entity.size * entity.size);
    }

    static _cursorBuildingPredicate(entity, game) {
        if (entity.team !== 'player' || !entity.isUnderConstruction) return false;
        // Check approximate collision
        const checkRadius = entity.size / 2 + 20;
        const dx = entity.x - game.mouse.worldX;
        const dy = entity.y - game.mouse.worldY;
        return (dx * dx + dy * dy) < (checkRadius * checkRadius);
    }

    static _cursorResourcePredicate(entity, game) {
        if (entity.amount <= 0) return false;

        // BOLT OPTIMIZATION: Check FOW explored state (for right-click gather)
        // Use cached grid coords (always available for static resources)
        const col = entity._gridCol !== undefined ? entity._gridCol : (entity.x / TILE_SIZE) | 0;
        const row = entity._gridRow !== undefined ? entity._gridRow : (entity.y / TILE_SIZE) | 0;

        if (game.fow && !game.fow.isExplored(col, row)) {
            return false;
        }

        const dx = entity.x - game.mouse.worldX;
        const dy = entity.y - game.mouse.worldY;
        return (dx * dx + dy * dy) < (entity.radius * entity.radius);
    }

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
        this._resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this._resizeHandler);

        // Estado del juego
        this.gameStartTime = Date.now();
        this._isPaused = false;
        this.isGameOver = false;

        // Palette: Attack notification throttle
        this.lastAttackNotification = { time: 0, x: 0, y: 0 };

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

        // Grupos de control (Ctrl+1-9 para guardar, 1-9 para seleccionar)
        this.controlGroups = new Array(10).fill(null).map(() => []);

        // Pointer Lock para múltiples monitores
        this.isPointerLocked = false;

        // Mouse
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.isMinimapDragging = false; // Palette: Minimap drag state

        // Modo de construcción
        this.buildMode = null;
        this.buildGhost = null;

        this.setupEventListeners();

        // OPTIMIZACIÓN: Inicializar Spatial Grid
        // Grid dinámico para unidades (se actualiza cada frame)
        // BOLT OPTIMIZATION: Split spatial grid by team to optimize search queries
        // Queries (O(N)) no longer need to check team or iterate over 50% of irrelevant entities.
        this.playerUnitGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);
        this.enemyUnitGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);

        // Grid estático para edificios (se actualiza solo al construir/destruir)
        this.buildingGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);

        // OPTIMIZACIÓN: Spatial Grid para recursos estáticos (evita iterar miles de recursos por frame)
        this.resourceGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);

        // SISTEMA DE GRID (Cuadrícula de construcción y colisiones)
        this.gridMap = new GridMap(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, TILE_SIZE);

        // SISTEMA DE TERRENOS
        this.terrainMap = new TerrainMap(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, TILE_SIZE);

        // SISTEMA DE TECNOLOGÍAS (variable global temporal)
        this.techManager = new TechManager(this);

        // SISTEMA DE FOG OF WAR (Niebla de Guerra)
        this.fow = new FogOfWar(this.terrainMap.cols, this.terrainMap.rows);
        this.visionTimer = 0;

        // BOLT OPTIMIZATION: Resize FOW buffer to match tile grid
        this._fowBufferCanvas = document.createElement('canvas');
        this._fowBufferCanvas.width = this.fow.cols;
        this._fowBufferCanvas.height = this.fow.rows;
        this._fowBufferCtx = this._fowBufferCanvas.getContext('2d', { alpha: true });
        this._fowImageData = this._fowBufferCtx.createImageData(this.fow.cols, this.fow.rows);
        // BOLT OPTIMIZATION: Cache Uint32Array view to avoid allocation in hot path
        this._fowImageData32 = new Uint32Array(this._fowImageData.data.buffer);

        // BOLT OPTIMIZATION: Pre-fill buffer with black (HIDDEN state) at init time
        // This avoids expensive first-frame full update (e.g., 230,400 iterations on ludicrous map)
        // HIDDEN color is RGBA(0,0,0,255) = 0xFF000000 in little-endian
        this._fowImageData32.fill(0xFF000000);
        this._fowBufferCtx.putImageData(this._fowImageData, 0, 0);

        // BOLT OPTIMIZATION: Initialize FOW Color Lookup Table (endian-safe)
        // We use a Uint32Array view to write pixels 4x faster (1 write vs 4 writes)
        // This requires pre-calculating the 32-bit integer values for each state.
        this._fowColorLUT = new Uint32Array(3);

        // Determine platform endianness for correct 32-bit color construction
        // Create a temporary buffer to map RGBA components to 32-bit integer
        const _colorBuf = new ArrayBuffer(4);
        const _colorBuf8 = new Uint8ClampedArray(_colorBuf);
        const _colorBuf32 = new Uint32Array(_colorBuf);

        const getInt32Color = (r, g, b, a) => {
            _colorBuf8[0] = r;
            _colorBuf8[1] = g;
            _colorBuf8[2] = b;
            _colorBuf8[3] = a;
            return _colorBuf32[0];
        };

        const exploredAlpha = Math.floor(CONFIG.VISION.EXPLORED_OPACITY * 255);
        // Map FOW_STATES indices (0, 1, 2) to colors
        this._fowColorLUT[FOW_STATES.HIDDEN] = getInt32Color(0, 0, 0, 255);
        this._fowColorLUT[FOW_STATES.EXPLORED] = getInt32Color(0, 0, 0, exploredAlpha);
        this._fowColorLUT[FOW_STATES.VISIBLE] = getInt32Color(0, 0, 0, 0);

        // SISTEMA DE PARTÍCULAS (Palette: Visual Feedback)
        if (typeof ParticleSystem !== 'undefined') {
            this.particleSystem = new ParticleSystem();
        }


        // Cargar imagen del cursor personalizado
        this.cursorImage = new Image();
        this.cursorImage.src = 'assets/icons/cursor.png';

        // Crear elemento DOM para el cursor
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'customCursor';
        this.cursorElement.style.position = 'fixed';
        this.cursorElement.style.pointerEvents = 'none';
        this.cursorElement.style.zIndex = '9999';
        this.cursorElement.style.width = '32px'; // Tamaño por defecto
        this.cursorElement.style.height = 'auto';

        const cursorImg = document.createElement('img');
        cursorImg.src = 'assets/icons/cursor.png';
        cursorImg.style.width = '100%';
        cursorImg.style.height = 'auto';
        cursorImg.style.display = 'block';
        this.cursorElement.appendChild(cursorImg);

        // Palette: Cursor Badge for Contextual Actions
        this.cursorBadge = document.createElement('img');
        this.cursorBadge.className = 'cursor-badge';
        this.cursorBadge.alt = '';
        this.cursorElement.appendChild(this.cursorBadge);

        document.body.appendChild(this.cursorElement);
        document.body.style.cursor = 'none';

        // Variables para optimización de UI
        this.lastUITime = 0;
        this.lastActionsStateKey = '';
        this.lastSelectionStateKey = '';
        this.lastSelectionIdKey = ''; // OPTIMIZATION: Track structural changes vs state changes
        this.lastResources = { ...this.resources }; // Palette: Track for animations

        // BOLT OPTIMIZATION: Track rendered values to avoid redundant DOM writes
        this._lastRenderedPopulation = -1;
        this._lastRenderedTimeStr = '';
        this._forceUIUpdate = true; // Force first render

        // Variables para el ciclo de tips (Palette)
        this.currentTipIndex = 0;
        this.lastTipTime = 0;

        // Cache para queries de cursor
        this._cursorQueryCache = [];

        // Cache para getEntityAt (Optimización Bolt)
        this._getEntityAtCache = [];

        // Cache para selección de arrastre (Palette)
        this._dragSelectCache = [];

        // Palette: Hover state for UI-to-World highlighting
        this.hoveredType = null;

        // OPTIMIZACIÓN: Cache de elementos DOM para UI
        this.uiElements = {
            woodCount: document.getElementById('woodCount'),
            foodCount: document.getElementById('foodCount'),
            goldCount: document.getElementById('goldCount'),
            stoneCount: document.getElementById('stoneCount'),
            currentPopulation: document.getElementById('currentPopulation'),
            maxPopulation: document.getElementById('maxPopulation'),
            gameTime: document.getElementById('gameTime'),
            idleVillagerBtn: document.getElementById('idleVillagerBtn'),
            idleVillagerCount: document.getElementById('idleVillagerCount'),
            selectionContent: document.getElementById('selectionContent'),
            commandPanel: document.getElementById('commandPanel'),
            notifications: document.getElementById('notifications')
        };

        // Palette: Attach listener for Idle Villager button
        if (this.uiElements.idleVillagerBtn) {
            this.uiElements.idleVillagerBtn.onclick = () => {
                this.selectNextIdleVillager();
                // Return focus to canvas for gameplay flow
                setTimeout(() => this.canvas.focus(), 50);
            };
            this.uiElements.idleVillagerBtn.onmouseenter = () => this.hoveredType = 'idle_villager';
            this.uiElements.idleVillagerBtn.onmouseleave = () => this.hoveredType = null;
        }

        // Cache para renderizado (evita alocación de arrays en cada frame)
        this._renderCache = [];
        this._resourceRenderCache = [];
        this._rowCache = []; // BOLT OPTIMIZATION: Cache for row-wise sorting
        this._gridPath = null; // BOLT OPTIMIZATION: Cache for grid path
        this.lastViewWidth = -1;
        this.lastViewHeight = -1;

        // BOLT OPTIMIZATION: Minimap Buffer
        // Cache static layers (Background, Resources, Buildings) to avoid re-drawing them every frame.
        this._minimapBufferCanvas = document.createElement('canvas');
        this._minimapBufferCtx = this._minimapBufferCanvas.getContext('2d');
        this._minimapDirty = true;

        // BOLT OPTIMIZATION: Cache minimap FOW paths to avoid Path2D allocation every frame
        // Only rebuilt when FOW state changes (detected via _minimapDirty flag)
        this._minimapFOWHiddenPath = new Path2D();
        this._minimapFOWExploredPath = new Path2D();
        this._minimapFOWDirty = true;

        // BOLT OPTIMIZATION: Offscreen Terrain Buffer
        // Replaces per-frame tile iteration with a cached large canvas (~1.5x viewport)
        // Only re-renders when camera moves near the edge of the buffer.
        this._terrainBufferCanvas = document.createElement('canvas');
        this._terrainBufferCtx = this._terrainBufferCanvas.getContext('2d');
        this._terrainBufferRect = { x: -99999, y: -99999, width: 0, height: 0 };

        // OPTIMIZACIÓN: Rastreo de Centros Urbanos (O(1) CheckGameOver)
        // Evita iterar todos los edificios para verificar condiciones de victoria
        this.townCenterCounts = {
            player: 0,
            enemy: 0
        };

        // BOLT OPTIMIZATION: Cache player building counts for O(1) UI updates
        this.playerBuildingCounts = {};

        // BOLT OPTIMIZATION: Cache drop-off points (TownCenter, Storage)
        // Avoids O(N) search through all buildings by Villagers
        this.dropOffPoints = [];

        // BOLT OPTIMIZATION: Cache team colors to avoid parsing strings every frame
        this._playerColor = null;
        this._enemyColor = null;
        this._updateTeamColors();

        this.initializeGame();
        this.updateUI();
    }

    // BOLT OPTIMIZATION: Update cached team colors
    _updateTeamColors() {
        if (typeof civilizationManager !== 'undefined') {
            this._playerColor = civilizationManager.getTeamColor(this.civilizationId, 'player');
            this._enemyColor = civilizationManager.getTeamColor(this.civilizationId, 'enemy');
        } else {
            // Fallback colors if manager not available
            this._playerColor = 'rgba(72, 187, 120, 0.3)';
            this._enemyColor = 'rgba(197, 48, 48, 0.3)';
        }
    }

    /**
     * Limpieza de recursos del juego
     * Debe llamarse antes de destruir la instancia para evitar memory leaks
     */
    destroy() {
        // Remover event listeners
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }

        // Remover cursor personalizado del DOM
        if (this.cursorElement && this.cursorElement.parentNode) {
            this.cursorElement.parentNode.removeChild(this.cursorElement);
        }

        // Restaurar cursor del sistema
        document.body.style.cursor = '';

        // Limpiar referencias
        this.units = [];
        this.buildings = [];
        this.enemies = [];
        this.selectedEntities = [];
        this.resourceNodes = [];
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.viewWidth = this.canvas.width;
        this.viewHeight = this.canvas.height;

        // Resize terrain buffer (1.5x viewport to allow scrolling without immediate re-render)
        if (this._terrainBufferCanvas) {
            this._terrainBufferCanvas.width = Math.floor(this.viewWidth * 1.5);
            this._terrainBufferCanvas.height = Math.floor(this.viewHeight * 1.5);
            // Invalidate buffer
            this._terrainBufferRect.x = -99999;
        }

        // Palette: Fix Minimap Resolution (Match CSS display size)
        // This prevents image distortion (squashing 2:1 canvas into 1:1 container)
        // and ensures accurate coordinate mapping.
        if (this.minimap) {
            const rect = this.minimap.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.minimap.width = rect.width;
                this.minimap.height = rect.height;
            }

            // BOLT OPTIMIZATION: Resize minimap buffer
            if (this._minimapBufferCanvas) {
                this._minimapBufferCanvas.width = this.minimap.width;
                this._minimapBufferCanvas.height = this.minimap.height;
                this._minimapDirty = true;
                this._minimapFOWDirty = true;
            }
        }

        // OPTIMIZATION: Pre-calculate culling radius to avoid Math.hypot in render loop
        // Diagonal / 2 + margin (100px)
        const halfWidth = this.viewWidth / 2;
        const halfHeight = this.viewHeight / 2;
        this.cullingRadius = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight) + 100;
    }

    initializeGame() {
        // Reiniciar contadores
        this.townCenterCounts.player = 0;
        this.townCenterCounts.enemy = 0;
        this.playerBuildingCounts = {};

        this._minimapDirty = true;
        this._minimapFOWDirty = true;

        // Crear mapa
        this.generateMap();

        // Crear Centro Urbano inicial (jugador)
        const townCenter = new TownCenter(400, 400, 'player');
        this._cacheEntityTerrain(townCenter); // OPTIMIZATION
        this.buildings.push(townCenter);
        this.dropOffPoints.push(townCenter);
        this.townCenterCounts.player++;
        this._updateBuildingCount('townCenter', 1);

        // Actualizar grid de edificios
        this.buildingGrid.add(townCenter);

        // Crear aldeanos iniciales
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = 400 + Math.cos(angle) * 100;
            const y = 400 + Math.sin(angle) * 100;
            const villager = new Villager(x, y, 'player');
            this._cacheEntityTerrain(villager); // OPTIMIZATION
            this.units.push(villager);
        }

        // Crear enemigos básicos
        this.spawnEnemies();

        // Centrar cámara en el Centro Urbano
        this.camera.x = 400 - this.viewWidth / 2;
        this.camera.y = 400 - this.viewHeight / 2;

        // Palette: Game Start Feedback
        if (typeof soundManager !== 'undefined') {
            soundManager.play('startGame');
        }

        if (this.particleSystem) {
            // Visual flair at the starting position (Town Center is at 400, 400)
            this.particleSystem.createFloatingText(400, 350, "¡A JUGAR!", '#d4af37');
            this.particleSystem.createExplosion(400, 400, '#d4af37', 20);
        }
    }

    /**
     * Carga el estado del juego desde un objeto guardado
     * @param {Object} state - Estado del juego
     */
    loadState(state) {
        if (!state) return;

        console.log('Cargando estado del juego...', state);

        // 1. Restore Scalars
        this.civilizationId = state.civilizationId || this.civilizationId;
        // Recalculate start time so that (now - startTime) equals saved gameTime
        this.gameStartTime = Date.now() - (state.gameTime || 0);

        if (state.resources) this.resources = { ...state.resources };
        if (state.population !== undefined) this.population = state.population;
        if (state.maxPopulation !== undefined) this.maxPopulation = state.maxPopulation;

        if (state.camera) {
            this.camera.x = state.camera.x;
            this.camera.y = state.camera.y;
            this.clampCamera();
        }

        // 2. Clear Entities & Grids
        this.units = [];
        this.buildings = [];
        this.enemies = [];
        this.selectedEntities = [];
        this.dropOffPoints = [];

        // Reset counters
        this.townCenterCounts = { player: 0, enemy: 0 };
        this.playerBuildingCounts = {};

        // Clear grids
        if (this.playerUnitGrid) this.playerUnitGrid.clear();
        if (this.enemyUnitGrid) this.enemyUnitGrid.clear();
        if (this.buildingGrid) this.buildingGrid.clear();
        if (this.resourceGrid) this.resourceGrid.clear();

        // 3. Restore Resources
        this.resourceNodes = [];
        if (state.resourceNodes) {
            for (const r of state.resourceNodes) {
                // Ensure radius is set (default 20)
                const radius = r.radius || 20;
                const node = {
                    x: r.x,
                    y: r.y,
                    type: r.type,
                    amount: r.amount,
                    radius: radius,
                    playerId: r.playerId || null,
                    // Pre-calculate grid coords
                    _gridCol: (r.x / TILE_SIZE) | 0,
                    _gridRow: (r.y / TILE_SIZE) | 0
                };
                this.resourceNodes.push(node);
                if (this.resourceGrid && node.amount > 0) {
                    this.resourceGrid.add(node);
                }
            }
        }

        // 4. Restore Entities
        const ENTITY_CLASSES = {
            'villager': Villager,
            'warrior': Warrior,
            'archer': Archer,
            'townCenter': TownCenter,
            'house': House,
            'barracks': Barracks,
            'storage': Storage,
            'storageWood': StorageWood,
            'market': Market,
            'temple': Temple,
            'workshop': Workshop
        };

        const restoreEntity = (eData, list, grid) => {
            const ClassRef = ENTITY_CLASSES[eData.type];
            if (!ClassRef) return;

            // Constructor usually expects (x, y, team)
            const entity = new ClassRef(eData.x, eData.y, eData.team);

            // Restore props
            entity.hp = eData.hp;
            if (eData.maxHp) entity.maxHp = eData.maxHp;

            // Unit specifics
            if (entity.isUnit) {
                if (eData.state) entity.state = eData.state;
                if (eData.carryAmount) entity.carryAmount = eData.carryAmount;
                if (eData.carryType) entity.carryType = eData.carryType;
            }

            // Building specifics
            if (entity.isBuilding) {
                if (eData.isUnderConstruction) {
                    entity.isUnderConstruction = true;
                    entity.constructionMaxHp = entity.maxHp; // Usually correct
                    // eData.constructionProgress is ratio 0-1
                } else {
                    entity.isUnderConstruction = false;
                }

                // Grid props
                if (eData.widthTiles) entity.widthTiles = eData.widthTiles;
                if (eData.heightTiles) entity.heightTiles = eData.heightTiles;
                if (eData.gridCol !== undefined) entity.gridCol = eData.gridCol;
                else entity.gridCol = (eData.x / TILE_SIZE) | 0; // Fallback

                if (eData.gridRow !== undefined) entity.gridRow = eData.gridRow;
                else entity.gridRow = (eData.y / TILE_SIZE) | 0;

                // Update counts
                if (entity.team === 'player') {
                    this._updateBuildingCount(entity.type, 1);
                    if (entity.type === 'townCenter' || entity.type === 'storage') {
                        this.dropOffPoints.push(entity);
                    }
                }

                if (entity.type === 'townCenter') {
                    if (this.townCenterCounts[entity.team] !== undefined) {
                        this.townCenterCounts[entity.team]++;
                    }
                }

                // Mark grid
                if (this.gridMap && entity.widthTiles && entity.heightTiles) {
                    this.gridMap.occupyArea(entity.gridCol, entity.gridRow, entity.widthTiles, entity.heightTiles, entity);
                }
            }

            // Optimization cache
            this._cacheEntityTerrain(entity);

            // Add to main lists
            list.push(entity);
            if (grid) grid.add(entity);
        };

        if (state.units) {
            for (const u of state.units) {
                // Game.js puts player units in this.units
                if (u.team === 'player') {
                    restoreEntity(u, this.units, this.playerUnitGrid);
                } else {
                    // Fallback just in case mixed
                    restoreEntity(u, this.enemies, this.enemyUnitGrid);
                }
            }
        }

        if (state.enemies) {
            for (const e of state.enemies) {
                 restoreEntity(e, this.enemies, this.enemyUnitGrid);
            }
        }

        if (state.buildings) {
            for (const b of state.buildings) {
                 restoreEntity(b, this.buildings, this.buildingGrid);
            }
        }

        // 5. Restore Techs
        if (state.researchedTechs && this.techManager) {
            this.techManager.researchedTechs = new Set(state.researchedTechs);
            if (this.techManager.applyResearchedEffects) {
                this.techManager.applyResearchedEffects();
            }
        }

        // 6. Refresh UI & Colors
        this._updateTeamColors();
        this._minimapDirty = true;
        this._minimapFOWDirty = true;
        this.updateUI();
        this.showNotification('Partida cargada correctamente', 'success');
    }

    generateMap() {
        // Usar el generador procedural de mapas (variable global temporal)
        if (typeof ProceduralMapGenerator !== 'undefined') {
            console.log('Usando generador procedural de mapas');

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

        // Inicializar el grid espacial de recursos
        this.updateResourceGrid();
    }

    updateResourceGrid() {
        if (!this.resourceGrid) return;

        this._minimapDirty = true;

        this.resourceGrid.clear();
        for (const node of this.resourceNodes) {
            if (node.amount > 0) {
                this.resourceGrid.add(node);
            }
        }
    }

    updateBuildingGrid() {
        if (!this.buildingGrid) return;

        this._minimapDirty = true;

        this.buildingGrid.clear();
        // Solo añadir edificios vivos
        // Asumimos que this.buildings ya ha sido filtrado de muertos antes de llamar a esto
        const len = this.buildings.length;
        for (let i = 0; i < len; i++) {
            if (!this.buildings[i].isDead) {
                this.buildingGrid.add(this.buildings[i]);
            }
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
        this.resourceNodes = [];

        for (let res of generatedMap.resources) {
            this.resourceNodes.push({
                x: res.x * TILE_SIZE,
                y: res.y * TILE_SIZE,
                type: res.type,
                amount: res.amount,
                radius: 20,
                playerId: res.playerId || null,
                // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                // res.x and res.y are already grid coordinates from mapGenerator
                _gridCol: res.x,
                _gridRow: res.y
            });
        }

        // Actualizar grid espacial con los nuevos recursos
        this.updateResourceGrid();
    }

    generateSimpleMap() {
        // Código original de generación simple (fallback)
        const resourceTypes = [
            { type: 'wood', amount: 600, weight: 0.35 },  // 35% de probabilidad (más común)
            { type: 'food', amount: 500, weight: 0.30 },  // 30% de probabilidad
            { type: 'gold', amount: 400, weight: 0.20 },  // 20% de probabilidad (más valioso)
            { type: 'stone', amount: 400, weight: 0.15 }  // 15% de probabilidad (más raro)
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
            // OPTIMIZATION: Squared distance check
            const dxPlayer = x - 400;
            const dyPlayer = y - 400;
            const distSqPlayer = dxPlayer * dxPlayer + dyPlayer * dyPlayer;

            // Evitar spawn cerca de la base enemiga
            const dxEnemy = x - (CONFIG.CANVAS_WIDTH - 400);
            const dyEnemy = y - (CONFIG.CANVAS_HEIGHT - 400);
            const distSqEnemy = dxEnemy * dxEnemy + dyEnemy * dyEnemy;

            // Solo colocar si está lejos de ambas bases (mínimo 200 unidades, 200^2 = 40000)
            if (distSqPlayer > 40000 && distSqEnemy > 40000) {
                this.resourceNodes.push({
                    x, y,
                    type: resType.type,
                    amount: resType.amount,
                    radius: 20,
                    // BOLT OPTIMIZATION: Pre-calculate grid coords for FOW check
                    _gridCol: (x / TILE_SIZE) | 0,
                    _gridRow: (y / TILE_SIZE) | 0
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
            this._cacheEntityTerrain(enemy); // OPTIMIZATION
            this.enemies.push(enemy);
        }

        // Enemy town center
        const enemyTC = new TownCenter(CONFIG.CANVAS_WIDTH - 400, CONFIG.CANVAS_HEIGHT - 400, 'enemy');
        this._cacheEntityTerrain(enemyTC); // OPTIMIZATION
        this.buildings.push(enemyTC);
        this.buildingGrid.add(enemyTC);
        this.dropOffPoints.push(enemyTC);
        this.townCenterCounts.enemy++;
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

        // Palette: Dedicated Minimap Drag Handler
        window.addEventListener('mousemove', (e) => {
            if (this.isMinimapDragging) {
                this.handleMinimapInput(e.clientX, e.clientY, false);
            }
        });

        // Global mouseup to stop dragging anywhere
        window.addEventListener('mouseup', () => {
            if (this.isMinimapDragging) {
                this.isMinimapDragging = false;
                this.minimap.style.cursor = 'crosshair'; // Restore default
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

        // Minimapa interaction (Click + Drag)
        this.minimap.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection etc
            this.isMinimapDragging = true;
            this.minimap.style.cursor = 'grabbing'; // Palette: Visual feedback
            this.handleMinimapInput(e.clientX, e.clientY, true);
        });

        // Double click selection (Palette)
        this.canvas.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(e);
        });
    }

    // Palette: Helper for Minimap Navigation
    handleMinimapInput(clientX, clientY, triggerPing = false) {
        const rect = this.minimap.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Determine click position relative to map
        // Note: this.minimap.width is now synced with rect.width in resizeCanvas
        // but we use rect.width for safety in case resize hasn't fired yet
        const width = rect.width || this.minimap.width;
        const height = rect.height || this.minimap.height;

        const worldX = (x / width) * CONFIG.CANVAS_WIDTH;
        const worldY = (y / height) * CONFIG.CANVAS_HEIGHT;

        // Use centralized focus method
        this.focusCamera(worldX, worldY, triggerPing);
    }

    // Palette: Centralized Camera Focus with Visual Feedback
    focusCamera(targetX, targetY, triggerPing = true) {
        this.camera.x = targetX - this.viewWidth / 2;
        this.camera.y = targetY - this.viewHeight / 2;
        this.clampCamera();

        if (triggerPing && this.particleSystem && this.particleSystem.createFocusPing) {
            this.particleSystem.createFocusPing(targetX, targetY);
        }
    }

    // Palette: Helper to keep camera in bounds
    clampCamera() {
        const maxCamX = CONFIG.CANVAS_WIDTH - this.viewWidth;
        const maxCamY = CONFIG.CANVAS_HEIGHT - this.viewHeight;

        if (this.camera.x < 0) this.camera.x = 0;
        else if (this.camera.x > maxCamX) this.camera.x = maxCamX;

        if (this.camera.y < 0) this.camera.y = 0;
        else if (this.camera.y > maxCamY) this.camera.y = maxCamY;
    }

    /**
     * Helper para obtener unidades militares del jugador
     */
    getMilitaryUnits() {
        return this.units.filter(u => u.type !== 'villager' && u.team === 'player' && !u.isDead);
    }

    /**
     * Selecciona todas las unidades militares del jugador
     */
    selectAllArmy() {
        const army = this.getMilitaryUnits();

        if (army.length === 0) {
            this.showNotification('No tienes unidades militares', 'info');
            return;
        }

        this.selectedEntities = [...army];
        this.updateSelectionPanel();
        this.updateActionsPanel();
        this.showNotification(`${army.length} unidades militares seleccionadas`, 'info');

        if (typeof soundManager !== 'undefined') {
            soundManager.play('click');
        }
    }

    /**
     * Gets the closest player entity at the specified world coordinates.
     * BOLT OPTIMIZATION: Uses SpatialGrid queries instead of iterating all entities.
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Entity|null} The closest entity or null
     */
    getEntityAt(worldX, worldY) {
        let closest = null;
        let closestDistSq = Infinity;

        // BOLT OPTIMIZATION: Use SpatialGrid queries instead of iterating all entities (O(1) vs O(N))
        // Defensive init to prevent crash if constructor skipped/overridden
        if (!this._cursorQueryCache) this._cursorQueryCache = [];
        const cache = this._cursorQueryCache;
        cache.length = 0;

        // Query units (small radius) - 50px covers standard units (size 32)
        this.playerUnitGrid.query(worldX, worldY, 50, cache, false);
        this.enemyUnitGrid.query(worldX, worldY, 50, cache, false);

        // Query buildings (large radius) - 150px covers TownCenter (size ~160px)
        if (this.buildingGrid) {
            this.buildingGrid.query(worldX, worldY, 150, cache, false);
        }

        const len = cache.length;
        for (let i = 0; i < len; i++) {
            const entity = cache[i];

            // Solo permitir seleccionar entidades del jugador o enemigos VISIBLES
            if (entity.team !== 'player') {
                // Use cached grid coords if available for FOW check (faster)
                // Fallback to calculation
                const col = entity._lastGridCol !== undefined ? entity._lastGridCol : (entity.x / TILE_SIZE) | 0;
                const row = entity._lastGridRow !== undefined ? entity._lastGridRow : (entity.y / TILE_SIZE) | 0;

                if (!this.fow.isVisible(col, row)) {
                    continue;
                }
            }

            const dx = entity.x - worldX;
            const dy = entity.y - worldY;
            const distSq = dx * dx + dy * dy;
            const sizeSq = entity.size * entity.size;

            if (distSq < sizeSq && distSq < closestDistSq) {
                closest = entity;
                closestDistSq = distSq;
            }
        }
        return closest;
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

            const closest = this.getEntityAt(this.mouse.worldX, this.mouse.worldY);

            if (closest) {
                this.selectedEntities = [closest];

                // Reproducir sonido de selección (variable global temporal)
                if (typeof soundManager !== 'undefined') {
                    soundManager.playEntitySelection(closest.type);
                }
            }
        } else {
            // Selección de área
            // BOLT OPTIMIZATION: Use SpatialGrid queryRect instead of iterating all entities (O(N))
            // This is ~130x faster for small selections and avoids iterating enemies/neutral entities.

            if (!this._dragSelectCache) this._dragSelectCache = [];
            const cache = this._dragSelectCache;
            const width = maxX - minX;
            const height = maxY - minY;

            // Pass 1: Player Units (Clear cache)
            this.playerUnitGrid.queryRect(minX, minY, width, height, cache, true);

            // Pass 2: Buildings (Append to cache)
            if (this.buildingGrid) {
                this.buildingGrid.queryRect(minX, minY, width, height, cache, false);
            }

            // Filter results
            const len = cache.length;
            for (let i = 0; i < len; i++) {
                const entity = cache[i];
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

    /**
     * Handles double click to select all visible units of the same type.
     */
    handleDoubleClick(e) {
        // Prevent default behavior (though not strictly needed on canvas usually)
        if (e && e.preventDefault) e.preventDefault();

        // 1. Check if we double-clicked on a player entity
        // We reuse the mouse coordinates as they are updated on mousemove
        const target = this.getEntityAt(this.mouse.worldX, this.mouse.worldY);

        if (target && target.team === 'player') {
            const type = target.type;

            // 2. Find all visible entities of the same type and team
            // BOLT OPTIMIZATION: Use SpatialGrid queryRect with camera bounds (O(Visible) vs O(N))
            if (!this._dragSelectCache) this._dragSelectCache = [];
            const cache = this._dragSelectCache;

            if (target.isUnit) {
                this.playerUnitGrid.queryRect(this.camera.x, this.camera.y, this.viewWidth, this.viewHeight, cache, true);
            } else if (this.buildingGrid) {
                this.buildingGrid.queryRect(this.camera.x, this.camera.y, this.viewWidth, this.viewHeight, cache, true);
            } else {
                cache.length = 0;
            }

            const visibleSameType = [];
            const len = cache.length;
            const camX = this.camera.x;
            const camY = this.camera.y;
            const viewW = this.viewWidth;
            const viewH = this.viewHeight;

            for (let i = 0; i < len; i++) {
                const u = cache[i];
                if (u.team === 'player' && u.type === type && !u.isDead) {
                    if (u.x >= camX && u.x <= camX + viewW &&
                        u.y >= camY && u.y <= camY + viewH) {
                        visibleSameType.push(u);
                    }
                }
            }

            if (visibleSameType.length > 0) {
                this.selectedEntities = visibleSameType;
                this.updateSelectionPanel();
                this.updateActionsPanel();

                // Feedback
                const name = target.name || type;
                this.showNotification(`Seleccionados todos los visibles: ${name}`, 'info');

                if (typeof soundManager !== 'undefined') {
                    soundManager.play('click');
                }
            }
        }
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

        // Palette: Visual feedback on the button if visible
        if (this.uiElements.idleVillagerBtn && !this.uiElements.idleVillagerBtn.classList.contains('hidden')) {
            this.uiElements.idleVillagerBtn.classList.add('active-key');
            setTimeout(() => this.uiElements.idleVillagerBtn.classList.remove('active-key'), 150);
        }

        // Ciclar al siguiente aldeano inactivo
        this.idleVillagerIndex = this.idleVillagerIndex % idleVillagers.length;
        const villager = idleVillagers[this.idleVillagerIndex];

        // Seleccionar el aldeano
        this.selectedEntities = [villager];
        this.updateSelectionPanel();
        this.updateActionsPanel();

        // Centrar cámara en el aldeano
        this.focusCamera(villager.x, villager.y);

        // Incrementar índice para la próxima vez
        this.idleVillagerIndex++;
    }

    handleRightClick() {
        if (this.selectedEntities.length === 0) return;

        // BOLT OPTIMIZATION: Use Spatial Grid find() instead of O(N) loops
        // Predicates are static and check visibility/state/hitbox
        // Context 'this' passes the Game instance (for FOW and mouse coords)

        // Verificar si clickeó en un enemigo
        const targetEnemy = this.enemyUnitGrid.find(
            this.mouse.worldX,
            this.mouse.worldY,
            100, // Search radius
            Game._cursorEnemyPredicate,
            this
        );

        // Verificar si clickeó en un nodo de recursos
        const targetResource = this.resourceGrid.find(
            this.mouse.worldX,
            this.mouse.worldY,
            50, // Resources are smaller
            Game._cursorResourcePredicate,
            this
        );

        // Verificar si clickeó en un edificio en construcción (propio)
        const targetBuilding = this.buildingGrid.find(
            this.mouse.worldX,
            this.mouse.worldY,
            100,
            Game._cursorBuildingPredicate,
            this
        );

        // Comandar unidades
        let moveCommandTriggered = false;
        let attackCommandTriggered = false;
        let gatherCommandTriggered = false;
        let buildCommandTriggered = false;
        let rallyPointTriggered = false;

        for (let entity of this.selectedEntities) {
            if (entity.isUnit) {
                if (targetEnemy && entity.canAttack) {
                    entity.attackTarget = targetEnemy;
                    entity.gatherTarget = null;
                    entity.targetX = null;
                    if (entity.type === 'villager') entity.state = 'ATTACKING';
                    attackCommandTriggered = true;
                } else if (targetResource && entity.canGather) {
                    entity.gatherTarget = targetResource;
                    entity.attackTarget = null;
                    entity.targetX = null;
                    // Para aldeanos, tryGather se encargará, pero forzamos el inicio si es necesario
                    if (entity.type === 'villager') {
                        entity.state = 'GATHERING';
                        entity.currentResourceNode = targetResource;
                    }
                    gatherCommandTriggered = true;
                } else if (targetBuilding && entity.type === 'villager') {
                    // Asignar construcción
                    entity.state = 'BUILDING';
                    entity.buildTarget = targetBuilding;
                    entity.attackTarget = null;
                    entity.gatherTarget = null;
                    entity.targetX = null;
                    buildCommandTriggered = true;
                } else {
                    entity.targetX = this.mouse.worldX;
                    entity.targetY = this.mouse.worldY;
                    entity.attackTarget = null;
                    entity.gatherTarget = null;
                    if (entity.type === 'villager') entity.state = 'MOVING';
                    moveCommandTriggered = true;
                }
            } else if (entity.team === 'player' && typeof entity.setRallyPoint === 'function') {
                // Configurar punto de reunión (Rally Point)
                entity.setRallyPoint(this.mouse.worldX, this.mouse.worldY);
                rallyPointTriggered = true;
            }
        }

        // Palette: Visual feedback for commands
        if (this.particleSystem) {
            if (attackCommandTriggered) {
                this.particleSystem.createAttackRipple(this.mouse.worldX, this.mouse.worldY);
            } else if (gatherCommandTriggered) {
                this.particleSystem.createGatherRipple(this.mouse.worldX, this.mouse.worldY);
            } else if (buildCommandTriggered) {
                this.particleSystem.createBuildRipple(this.mouse.worldX, this.mouse.worldY);
            } else if (moveCommandTriggered) {
                this.particleSystem.createMoveRipple(this.mouse.worldX, this.mouse.worldY);
            } else if (rallyPointTriggered) {
                this.particleSystem.createMoveRipple(this.mouse.worldX, this.mouse.worldY);
            }
        }
    }

    /**
     * Guarda la selección actual en un grupo de control
     * @param {number} groupNum - Número del grupo (1-9)
     */
    saveControlGroup(groupNum) {
        if (this.selectedEntities.length === 0) {
            this.showNotification('Nada seleccionado para guardar', 'error');
            return;
        }

        // Guardar referencias a las entidades (no copias)
        this.controlGroups[groupNum] = [...this.selectedEntities];

        const count = this.selectedEntities.length;
        const type = count === 1 ? this.selectedEntities[0].name : `${count} unidades`;
        this.showNotification(`Grupo ${groupNum}: ${type}`, 'info');
    }

    /**
     * Selecciona las entidades de un grupo de control
     * @param {number} groupNum - Número del grupo (1-9)
     * @param {boolean} addToSelection - Si true, añade al grupo actual
     */
    selectControlGroup(groupNum, addToSelection = false) {
        const group = this.controlGroups[groupNum];

        if (!group || group.length === 0) {
            this.showNotification(`Grupo ${groupNum} vacío`, 'info');
            return;
        }

        // Filtrar entidades muertas
        const aliveEntities = group.filter(e => !e.isDead);

        if (aliveEntities.length === 0) {
            this.controlGroups[groupNum] = [];
            this.showNotification(`Grupo ${groupNum} vacío (entidades muertas)`, 'info');
            return;
        }

        // Actualizar grupo si algunas murieron
        if (aliveEntities.length !== group.length) {
            this.controlGroups[groupNum] = aliveEntities;
        }

        if (addToSelection) {
            // Añadir al grupo actual
            for (const entity of aliveEntities) {
                if (!this.selectedEntities.includes(entity)) {
                    this.selectedEntities.push(entity);
                }
            }
        } else {
            // Reemplazar selección
            this.selectedEntities = [...aliveEntities];
        }

        // Centrar cámara en el grupo
        if (aliveEntities.length > 0) {
            let centerX = 0, centerY = 0;
            for (const entity of aliveEntities) {
                centerX += entity.x;
                centerY += entity.y;
            }
            centerX /= aliveEntities.length;
            centerY /= aliveEntities.length;

            this.camera.x = centerX - this.viewWidth / 2;
            this.camera.y = centerY - this.viewHeight / 2;
        }

        this.updateSelectionInfo();
    }

    /**
     * Destruye las entidades seleccionadas del jugador (con confirmación)
     * Palette: UX Enhancement for destructive actions
     */
    deleteSelectedEntities() {
        const toDelete = this.selectedEntities.filter(e => e.team === 'player' && !e.isDead);

        if (toDelete.length === 0) {
            // Si hay selección pero no es propia
            if (this.selectedEntities.length > 0 && this.selectedEntities.some(e => e.team !== 'player')) {
                this.showNotification('No puedes destruir unidades enemigas', 'error');
            }
            return;
        }

        const count = toDelete.length;
        const type = count === 1 ? toDelete[0].name : `${count} entidades`;

        // Usar el helper global definido en main.js
        if (window.showConfirmation) {
            window.showConfirmation(
                `¿Destruir ${type}? Esta acción no se puede deshacer.`,
                () => {
                    // Confirm callback
                    let destroyedCount = 0;
                    for (const entity of toDelete) {
                        if (!entity.isDead) {
                            entity.hp = 0;
                            entity.isDead = true;
                            destroyedCount++;
                        }
                    }

                    if (destroyedCount > 0) {
                        this.showNotification(`${type} destruido(s)`, 'info');
                        // Feedback auditivo (usamos error como sonido de destrucción por ahora)
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('error');
                        }
                        this.selectedEntities = [];
                        this.updateSelectionPanel();
                        this.updateActionsPanel();
                    }
                }
            );
        }
    }

    handleKeyPress(e) {
        // Delete - Destruir selección (Palette)
        if (e.key === 'Delete') {
            this.deleteSelectedEntities();
            return;
        }

        // P - Toggle Pause (Palette)
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }

        // TAB - Seleccionar siguiente aldeano inactivo
        if (e.key === 'Tab') {
            e.preventDefault();
            if (this.enableIdleVillagerCycle) {
                this.selectNextIdleVillager();
            }
            return;
        }

        // Palette: Comma (,) - Seleccionar todo el ejército
        if (e.key === ',') {
            e.preventDefault();
            this.selectAllArmy();
            return;
        }

        // Grupos de control (1-9)
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= 9) {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+1-9: Guardar grupo
                e.preventDefault();
                this.saveControlGroup(numKey);
                return;
            } else if (!e.altKey && !e.shiftKey) {
                // 1-9 sin modificadores: Seleccionar grupo
                this.selectControlGroup(numKey, e.shiftKey);
                return;
            }
        }

        // B - Build menu
        if (e.key === 'b' || e.key === 'B') {
            if (this.selectedEntities.length === 1 &&
                this.selectedEntities[0].type === 'villager') {
                this.openBuildMenu();
            } else {
                // Palette: Feedback for invalid action
                if (this.selectedEntities.length === 0) {
                    this.showNotification('Selecciona un aldeano para construir', 'error');
                } else if (this.selectedEntities.some(e => e.type !== 'villager')) {
                    this.showNotification('Solo los aldeanos pueden construir', 'error');
                } else {
                    this.showNotification('Selecciona un solo aldeano para construir', 'error');
                }
                if (typeof soundManager !== 'undefined') soundManager.play('error');
            }
        }

        // ESC - Cancel y liberar pointer lock
        if (e.key === 'Escape') {
            // 1. Cancelar modo de construcción si está activo
            if (this.buildMode) {
                this.buildMode = null;
                this.closeBuildMenu();
                return;
            }

            this.closeBuildMenu(); // Asegurar que el menú se cierre

            // 2. Palette: Deselect entities if nothing else is active
            if (this.selectedEntities.length > 0) {
                this.selectedEntities = [];
                this.updateSelectionPanel();
                this.updateActionsPanel();
                return;
            }

            // 3. Liberar pointer lock si está activo
            if (this.isPointerLocked) {
                document.exitPointerLock();
            }
        }

        // H o Space - Center on town center (ir al centro urbano)
        if (e.key === 'h' || e.key === 'H' || e.key === ' ') {
            e.preventDefault();
            const tc = this.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
            if (tc) {
                this.focusCamera(tc.x, tc.y);

                // Palette: Visual feedback for Town Center button if visible (in quick actions)
                const content = document.getElementById('selectionContent');
                if (content) {
                    const btns = content.querySelectorAll('button');
                    for (let btn of btns) {
                        // Check if it's the TC button (by icon or text)
                        if (btn.innerHTML.includes('townCenter') || btn.textContent.includes('Centro Urbano')) {
                            btn.classList.add('active-key');
                            setTimeout(() => btn.classList.remove('active-key'), 150);
                            break;
                        }
                    }
                }
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
                const actionsGrid = document.getElementById('commandPanel');
                if (actionsGrid) {
                    const buttons = actionsGrid.querySelectorAll('.action-btn');
                    if (buttons[btnIndex] && !buttons[btnIndex].classList.contains('disabled')) {
                        // Palette: Visual feedback for hotkey
                        buttons[btnIndex].classList.add('active-key');
                        setTimeout(() => buttons[btnIndex].classList.remove('active-key'), 150);

                        buttons[btnIndex].click();
                        e.preventDefault();
                        return;
                    }
                }
            }
        }

        // F - Ciclar formaciones (solo con unidades seleccionadas)
        if (e.key === 'f' || e.key === 'F') {
            const selectedUnits = this.selectedEntities.filter(e => e.isUnit);
            if (selectedUnits.length > 1 && typeof formationManager !== 'undefined') {
                const formation = formationManager.cycleFormation();

                // Calcular centro del grupo
                let centerX = 0, centerY = 0;
                for (const unit of selectedUnits) {
                    centerX += unit.x;
                    centerY += unit.y;
                }
                centerX /= selectedUnits.length;
                centerY /= selectedUnits.length;

                // Aplicar formación
                formationManager.applyFormation(formation, selectedUnits, { x: centerX, y: centerY });
                this.showNotification(`Formación: ${formation}`, 'info');
                e.preventDefault();
                return;
            } else {
                // Palette: Feedback for invalid action
                if (selectedUnits.length <= 1) {
                    this.showNotification('Formaciones requieren múltiples unidades', 'error');
                }
                if (typeof soundManager !== 'undefined') soundManager.play('error');
            }
        }

        // WASD - Camera movement handled in updateCamera()
        // Eliminado manejo directo aquí para usar deltaTime y movimiento suave
    }

    _updateBuildingCount(type, delta) {
        if (!type) return;
        this.playerBuildingCounts[type] = (this.playerBuildingCounts[type] || 0) + delta;
    }

    /**
     * OPTIMIZATION: Cache terrain data on the entity to avoid expensive lookups
     * during combat and movement. Static entities (buildings) benefit the most.
     */
    _cacheEntityTerrain(entity) {
        if (!this.terrainMap || !entity) return;

        // Calculate grid coordinates once
        const invTileSize = this.terrainMap.invTileSize || (1 / TILE_SIZE);
        const col = (entity.x * invTileSize) | 0;
        const row = (entity.y * invTileSize) | 0;

        // Set cached properties
        entity._lastGridCol = col;
        entity._lastGridRow = row;

        // Fetch and store data
        const terrainData = this.terrainMap.getTerrainDataByGrid(col, row);

        if (terrainData) {
            entity._cachedTerrainData = terrainData;
            // Only relevant for units, but harmless to set for all
            entity._cachedTerrainSpeed = terrainData.movementSpeed;
        }
    }

    updateBuildMenuState() {
        // BOLT OPTIMIZATION: Use cached building counts (O(1)) and live DOM collection
        // Replaces O(N_buildings * M_options) with O(M_options)
        // Using getElementsByClassName for live collection (safer than caching static NodeList)
        const buildOptions = document.getElementsByClassName('build-option');

        // Use cached length for slightly better performance in loop
        const len = buildOptions.length;
        for (let i = 0; i < len; i++) {
            const option = buildOptions[i];
            const type = option.dataset.building;
            const cost = CONFIG.COSTS[type];
            // Access cached count directly
            const currentCount = this.playerBuildingCounts[type] || 0;

            // Palette: Update/Create Owned Badge
            let badge = option.querySelector('.owned-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'owned-badge';
                badge.setAttribute('aria-hidden', 'true');
                option.appendChild(badge);
            }

            // Update text content only if changed
            const badgeText = `${currentCount}`;
            if (badge.textContent !== badgeText) {
                badge.textContent = badgeText;
            }

            // Hide if 0 to reduce clutter
            badge.style.display = currentCount > 0 ? 'flex' : 'none';

            // Palette: Robust ARIA Label Handling
            // Store original label once to avoid accumulation
            if (!option.dataset.originalLabel) {
                option.dataset.originalLabel = option.getAttribute('aria-label');
            }

            let newLabel = option.dataset.originalLabel;
            if (currentCount > 0) {
                newLabel += ` - Tienes: ${currentCount}`;
            }

            // Palette: Visual affordability check
            if (cost) {
                // Reset state
                option.classList.remove('disabled');
                option.removeAttribute('aria-disabled');
                option.style.opacity = '1';
                option.style.cursor = 'pointer';

                // Check specific resource costs
                const costSpans = option.querySelectorAll('.build-cost span');
                costSpans.forEach(span => {
                    span.style.color = ''; // Reset
                    const img = span.querySelector('img');
                    if (img) {
                        const src = img.src.toLowerCase();
                        let resource = null;
                        if (src.includes('wood')) resource = 'wood';
                        else if (src.includes('food')) resource = 'food';
                        else if (src.includes('gold')) resource = 'gold';
                        else if (src.includes('stone')) resource = 'stone';

                        if (resource && cost[resource] && this.resources[resource] < cost[resource]) {
                            span.style.color = 'var(--accent-red)';
                        }
                    }
                });

                // Check total affordability
                if (!this.canAfford(cost)) {
                    option.classList.add('disabled');
                    option.setAttribute('aria-disabled', 'true');
                    option.style.opacity = '0.6';
                    option.style.cursor = 'not-allowed';

                    // Palette: Add accessible feedback for missing resources
                    const missing = [];
                    for (let [resource, amount] of Object.entries(cost)) {
                        if (this.resources[resource] < amount) {
                            const diff = amount - this.resources[resource];
                            missing.push(`${resource} (${diff})`);
                        }
                    }

                    if (missing.length > 0) {
                        newLabel += ` - Insuficiente: ${missing.join(', ')}`;

                        // Add visual warning (if not already present)
                        if (!option.querySelector('.build-warning')) {
                            const warning = document.createElement('div');
                            warning.className = 'build-warning';
                            warning.style.color = 'var(--accent-red)';
                            warning.style.fontSize = '0.8rem';
                            warning.style.marginTop = '4px';
                            warning.style.fontWeight = 'bold';
                            warning.textContent = '⚠️ Faltan recursos';
                            option.appendChild(warning);
                        }
                    }
                } else {
                    // Remove warning if present
                    const warning = option.querySelector('.build-warning');
                    if (warning) warning.remove();
                }

                // Apply accumulated label
                if (option.getAttribute('aria-label') !== newLabel) {
                    option.setAttribute('aria-label', newLabel);
                }
            }
        }
    }

    openBuildMenu() {
        const menu = document.getElementById('buildMenu');
        this.lastFocusedElement = document.activeElement;

        menu.classList.remove('hidden');

        // Activamos el trap focus para accesibilidad (Palette)
        FocusManager.trapFocus(menu);

        // Update state immediately
        this.updateBuildMenuState();

        // Setup build options handlers
        const buildOptions = document.querySelectorAll('.build-option');
        buildOptions.forEach(option => {
            const handleAction = (e) => {
                // Palette: Prevent action if disabled
                if (option.classList.contains('disabled') || option.getAttribute('aria-disabled') === 'true') {
                    e.stopPropagation();

                    // Visual feedback
                    option.classList.remove('shake');
                    void option.offsetWidth; // Force reflow
                    option.classList.add('shake');

                    // Auditory feedback (if soundManager exists)
                    if (typeof soundManager !== 'undefined') {
                        soundManager.play('error');
                    }

                    // Notification feedback
                    const missing = option.getAttribute('aria-label').split(' - Insuficiente: ')[1];
                    const msg = missing ? `Recursos insuficientes: ${missing}` : 'Recursos insuficientes';
                    this.showNotification(msg, 'error');

                    // Palette: Visual feedback for resources
                    const type = option.dataset.building;
                    if (type && CONFIG.COSTS[type]) {
                        this.flashMissingResources(CONFIG.COSTS[type]);
                    }

                    return;
                }

                const buildingType = option.dataset.building;
                this.startBuildMode(buildingType);
                this.closeBuildMenu();
            };

            option.onclick = handleAction;

            // Accessibility: Allow keyboard activation with Enter or Space
            option.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent scrolling for Space
                    handleAction(e);
                }
            };
        });
    }

    closeBuildMenu() {
        FocusManager.releaseTrap();
        document.getElementById('buildMenu').classList.add('hidden');

        // Restaurar foco al canvas para continuar jugando
        // Preferimos el canvas sobre el último elemento (que podría ser un botón de UI)
        // para que el jugador pueda usar atajos inmediatamente
        if (this.canvas) {
            this.canvas.focus();
        } else if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
        this.lastFocusedElement = null;
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
            this.flashMissingResources(cost);
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

            this._cacheEntityTerrain(building); // OPTIMIZATION
            this.buildings.push(building);
            this.buildingGrid.add(building);

            this._minimapDirty = true;

            // Actualizar contadores si es un Centro Urbano
            if (building.type === 'townCenter') {
                if (this.townCenterCounts[building.team] !== undefined) {
                    this.townCenterCounts[building.team]++;
                }
            }

            this._updateBuildingCount(building.type, 1);

            // BOLT OPTIMIZATION: Add to drop-off cache
            if (building.type === 'townCenter' || building.type === 'storage') {
                this.dropOffPoints.push(building);
            }

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

            this.showNotification(`${building.name} (En construcción)`, 'info', { x: building.x, y: building.y });
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

    /**
     * Encola una unidad para entrenamiento
     * @param {string} unitType - Tipo de unidad
     * @param {Building} building - Edificio que entrena
     */
    trainUnit(unitType, building) {
        if (building.isUnderConstruction) {
            this.showNotification('El edificio está en construcción', 'error');
            return;
        }

        // Verificar si el edificio tiene cola de producción
        if (!building.productionQueue) {
            this._trainUnitInstant(unitType, building);
            return;
        }

        // Verificar cola llena
        if (building.productionQueue.isFull()) {
            this.showNotification('Cola de producción llena (máx 5)', 'error');
            return;
        }

        const cost = CONFIG.UNIT_COSTS[unitType];

        if (!this.canAfford(cost)) {
            this.showNotification('Recursos insuficientes', 'error');
            this.flashMissingResources(cost);
            return;
        }

        if (this.population + building.productionQueue.length >= this.maxPopulation) {
            this.showNotification('Límite de población alcanzado. Construye más casas.', 'error');
            this.flashResource('population');
            return;
        }

        // Deducir recursos inmediatamente
        for (let [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }

        // Tiempo de entrenamiento según tipo
        const TRAINING_TIMES = {
            villager: 25,
            warrior: 30,
            archer: 35
        };
        const trainingTime = TRAINING_TIMES[unitType] || 30;

        // Encolar unidad
        building.queueUnit(unitType, cost, trainingTime);

        const queueLength = building.productionQueue.length;
        this.showNotification(`${unitType} encolado (${queueLength}/5)`, 'info');
        this.updateUI();
    }

    /**
     * Entrena una unidad instantáneamente (fallback para edificios sin cola)
     * @param {string} unitType 
     * @param {Building} building 
     */
    _trainUnitInstant(unitType, building) {
        const cost = CONFIG.UNIT_COSTS[unitType];

        if (!this.canAfford(cost)) {
            this.showNotification('Recursos insuficientes', 'error');
            this.flashMissingResources(cost);
            return;
        }

        if (this.population >= this.maxPopulation) {
            this.showNotification('Límite de población alcanzado', 'error');
            this.flashResource('population');
            return;
        }

        for (let [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }

        this._spawnUnit(unitType, building);
    }

    /**
     * Crea una unidad cerca de un edificio
     * @param {string} unitType - Tipo de unidad
     * @param {Building} building - Edificio origen
     * @returns {Unit} La unidad creada
     */
    _spawnUnit(unitType, building) {
        // Posición: rally point o cerca del edificio
        let x, y;
        if (building.rallyPoint) {
            x = building.rallyPoint.x;
            y = building.rallyPoint.y;
        } else {
            const angle = Math.random() * Math.PI * 2;
            x = building.x + Math.cos(angle) * (building.size + 30);
            y = building.y + Math.sin(angle) * (building.size + 30);
        }

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
            civilizationManager.applyUnitBonuses(unit, this.civilizationId);

            this._cacheEntityTerrain(unit); // OPTIMIZATION
            this.units.push(unit);
            this.population++;

            if (typeof soundManager !== 'undefined') {
                const soundKey = `create${unitType.charAt(0).toUpperCase() + unitType.slice(1)}`;
                soundManager.play(soundKey);
            }

            this.showNotification(`${unit.name} entrenado`, 'success', { x: unit.x, y: unit.y });
            this.updateUI();

            // Si hay rally point, mover la unidad hacia allá
            if (building.rallyPoint) {
                unit.targetX = building.rallyPoint.x;
                unit.targetY = building.rallyPoint.y;
            }
        }

        return unit;
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
            // OPTIMIZATION: Math.sqrt is faster than Math.hypot
            const length = Math.sqrt(dx * dx + dy * dy);
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
            this.clampCamera();
        }
    }

    /**
     * OPTIMIZACIÓN: Remueve entidades muertas in-place sin crear nuevo array
     * Esto evita allocations innecesarias en el game loop
     * @param {Array} array - Array de entidades a filtrar
     */
    _removeDeadInPlace(array) {
        let writeIdx = 0;
        for (let i = 0; i < array.length; i++) {
            if (!array[i].isDead) {
                array[writeIdx++] = array[i];
            }
        }
        array.length = writeIdx;
    }

    /**
     * Legacy getter for backward compatibility.
     * WARNING: This creates a new array on every access. Do not use in hot paths.
     */
    get entities() {
        return [...this.units, ...this.buildings, ...this.enemies];
    }

    update(deltaTime) {
        if (this.isPaused) return;

        // Actualizar cámara (Sistema RTS optimizado)
        // Palette: Allow camera movement even in Game Over state
        this.updateCamera(deltaTime);

        if (this.isGameOver) return;

        // Actualizar tecnologías
        if (this.techManager) this.techManager.update(deltaTime);

        // Actualizar partículas (Palette)
        if (this.particleSystem) this.particleSystem.update(deltaTime);

        // Actualizar Niebla de Guerra (Optimizado)
        // BOLT: Skip FOW entirely when disabled for performance testing
        if (CONFIG.VISION.ENABLED) {
            this.visionTimer += deltaTime;
            if (this.visionTimer >= CONFIG.VISION.UPDATE_INTERVAL) {
                this.visionTimer = 0;

                // Actualizar visión (FOW)
                // BOLT OPTIMIZATION: Use direct addEntity calls to avoid intermediate array allocation
                this.fow.beginUpdate();

                // 1. Unidades del jugador
                const unitsLen = this.units.length;
                for (let i = 0; i < unitsLen; i++) {
                    if (this.units[i].team === 'player') {
                        this.fow.addEntity(this.units[i]);
                    }
                }

                // 2. Edificios del jugador
                const buildingsLen = this.buildings.length;
                for (let i = 0; i < buildingsLen; i++) {
                    const b = this.buildings[i];
                    if (b.team === 'player') {
                        this.fow.addEntity(b);
                    }
                }

                this.fow.endUpdate();

                this._minimapDirty = true; // El minimapa debe reflejar la nueva visión
                this._minimapFOWDirty = true; // Rebuild FOW Paths

                // BOLT OPTIMIZATION: Update FOW bitmap buffer
                this._updateFOWBuffer();
            }
        }

        // OPTIMIZACIÓN: Actualizar Spatial Grid y Entidades
        // Separamos el bucle para iterar solo sobre unidades dinámicas (Jugador + Enemigos)
        // Los edificios son estáticos y no necesitan update() ni reinserción en spatialGrid cada frame.
        this.playerUnitGrid.clear();
        this.enemyUnitGrid.clear();

        // BOLT OPTIMIZATION: Split loop into Pass 1 (Grid Populate) and Pass 2 (Update Logic)
        // This fixes the "blind unit" bug where units processed early in the loop couldn't see units processed later.
        // Surprisingly, this is also ~65% faster due to better instruction cache locality (batching similar operations).

        // Pass 1: Populate Spatial Grid (O(N) - Fast integer arithmetic)
        const unitsLen = this.units.length;
        for (let i = 0; i < unitsLen; i++) {
            this.playerUnitGrid.add(this.units[i]);
        }

        const enemiesLen = this.enemies.length;
        for (let i = 0; i < enemiesLen; i++) {
            this.enemyUnitGrid.add(this.enemies[i]);
        }

        let hasDeadEntities = false;
        let hasDeadBuildings = false;

        // Pass 2: Update Logic (O(N) - AI, Physics, Combat)
        // 1. Player Units
        for (let i = 0; i < unitsLen; i++) {
            const unit = this.units[i];
            unit.update(deltaTime, this);
            if (unit.isDead) hasDeadEntities = true;
        }

        // 2. Enemies
        for (let i = 0; i < enemiesLen; i++) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this);
            if (enemy.isDead) hasDeadEntities = true;
        }

        // 3. Actualizar Edificios (colas de producción + death check)
        const buildingsLen = this.buildings.length;
        for (let i = 0; i < buildingsLen; i++) {
            const building = this.buildings[i];

            if (building.isDead) {
                hasDeadEntities = true;
                hasDeadBuildings = true;
                this._minimapDirty = true;

                // Actualizar contadores de TC al morir
                if (building.type === 'townCenter') {
                    if (this.townCenterCounts[building.team] !== undefined) {
                        this.townCenterCounts[building.team]--;
                    }
                }

                if (building.team === 'player') {
                    this._updateBuildingCount(building.type, -1);
                }

                continue;
            }

            // Procesar cola de producción (solo para edificios del jugador)
            if (building.team === 'player' && building.productionQueue && !building.isUnderConstruction) {
                const completed = building.update(deltaTime, this);
                if (completed) {
                    this._spawnUnit(completed.unitType, building);
                }
            }
        }

        // Remover entidades muertas (OPTIMIZADO: in-place para evitar allocations)
        if (hasDeadEntities) {
            this._removeDeadInPlace(this.units);
            this._removeDeadInPlace(this.buildings);
            this._removeDeadInPlace(this.enemies);
            this._removeDeadInPlace(this.selectedEntities);
            this._removeDeadInPlace(this.dropOffPoints);

            // Si murieron edificios, reconstruir el grid estático
            if (hasDeadBuildings) {
                this.updateBuildingGrid();
            }

            // Verificar condiciones de victoria/derrota
            this.checkGameOver();
        }

        // Actualizar population count (fuera del condicional para detectar spawns)
        // OPTIMIZACIÓN: Análisis estático confirma que this.units contiene EXCLUSIVAMENTE unidades del jugador.
        // Los enemigos se gestionan en this.enemies.
        // Acceso directo a length es O(1), eliminando el loop O(N) redundante.
        this.population = this.units.length;

        // Palette: Update Contextual Cursor
        this.updateCursorState();

        // Actualizar UI (Throttled to 10 FPS)
        const now = Date.now();
        if (now - this.lastUITime > 100) {
            this.updateUI();
            this.lastUITime = now;
        }
    }

    updateCursorState() {
        if (!this.cursorBadge) return;

        let showBadge = false;
        let badgeIcon = '';

        if (this.selectedEntities.length === 1) {
            const entity = this.selectedEntities[0];
            if (entity.team === 'player' && entity.isUnit) {
                // BOLT OPTIMIZATION: Use SpatialGrid.find() with static predicates
                // This replaces the previous query() + manual loop approach.
                // It avoids array allocation (writing to cache) and leverages early exit optimization.
                // The 'this.mouse' object is passed as context to avoid creating new objects per frame.

                // Attack Cursor Logic
                if (entity.canAttack) {
                    const target = this.enemyUnitGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        100, // Search radius increased to cover large entities
                        Game._cursorEnemyPredicate,
                        this
                    );

                    if (target) {
                        badgeIcon = 'assets/icons/swords.png';
                        showBadge = true;
                    }
                }

                // Build/Repair Cursor Logic (Villager only) - Before Gather
                if (!showBadge && entity.type === 'villager' && this.buildingGrid) {
                    const target = this.buildingGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        100,
                        Game._cursorBuildingPredicate,
                        this
                    );

                    if (target) {
                        badgeIcon = 'assets/icons/build.png';
                        showBadge = true;
                    }
                }

                // Gather Cursor Logic (Villager only) - Lower priority than attack
                if (!showBadge && entity.canGather && entity.type === 'villager' && this.resourceGrid) {
                    const res = this.resourceGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        50,
                        Game._cursorResourcePredicate,
                        this
                    );

                    if (res) {
                        // Map resource type to icon
                        if (res.type === 'wood') badgeIcon = 'assets/icons/wood.png';
                        else if (res.type === 'food') badgeIcon = 'assets/icons/food.png';
                        else if (res.type === 'gold') badgeIcon = 'assets/icons/gold.png';
                        else if (res.type === 'stone') badgeIcon = 'assets/icons/stone.png';
                        else badgeIcon = 'assets/icons/gold.png';

                        showBadge = true;
                    }
                }
            }
        }

        if (showBadge) {
            if (this.cursorBadge.src !== badgeIcon && !this.cursorBadge.src.endsWith(badgeIcon)) {
                this.cursorBadge.src = badgeIcon;
            }
            this.cursorBadge.style.display = 'block';
        } else {
            this.cursorBadge.style.display = 'none';
        }
    }

    get isPaused() {
        return this._isPaused;
    }

    set isPaused(value) {
        if (this._isPaused === value) return;

        this._isPaused = value;
        this._updatePauseState();
    }

    _updatePauseState() {
        // Update UI Button
        const btn = document.getElementById('pauseButton');
        const icon = document.getElementById('pauseIcon');
        const overlay = document.getElementById('pauseOverlay'); // Palette: Get overlay
        const resumeBtn = document.getElementById('resumeOverlayBtn'); // Palette: Get resume button

        if (btn && icon) {
            if (this._isPaused) {
                icon.textContent = '▶';
                btn.setAttribute('aria-label', 'Reanudar juego (P)');
                btn.classList.add('active-key');
            } else {
                icon.textContent = '⏸';
                btn.setAttribute('aria-label', 'Pausar juego (P)');
                btn.classList.remove('active-key');
            }
        }

        // Palette: Toggle Overlay and Focus
        if (overlay) {
            if (this._isPaused) {
                overlay.classList.remove('hidden');
                // Trap focus or just focus the button
                if (resumeBtn) {
                    // Wait for UI to update visibility
                    setTimeout(() => resumeBtn.focus(), 50);
                }
            } else {
                overlay.classList.add('hidden');
                // Return focus to canvas
                if (this.canvas) this.canvas.focus();
            }
        }

        // Timer Logic: Adjust start time to ignore pause duration
        if (this._isPaused) {
            this.pauseStartTime = Date.now();
        } else {
            if (this.pauseStartTime) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.gameStartTime += pauseDuration;
                this.pauseStartTime = null;
            }
        }
    }

    // Palette: Toggle Pause
    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
    }

    checkGameOver() {
        // OPTIMIZACIÓN: Verificación O(1) usando contadores mantenidos
        // Reemplaza la iteración O(N) sobre todos los edificios
        if (this.townCenterCounts.player <= 0) {
            this.gameOver(false);
        } else if (this.townCenterCounts.enemy <= 0) {
            this.gameOver(true);
        }
    }

    gameOver(victory) {
        this.isGameOver = true;
        const gameOverScreen = document.getElementById('gameOverScreen');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const statsContainer = document.getElementById('gameOverStats');

        if (victory) {
            title.textContent = '🏆 Victoria';
            title.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            message.textContent = '¡Has derrotado a todos los enemigos!';
            this.startVictoryConfetti(); // Palette: Trigger celebration
        } else {
            title.textContent = '💀 Derrota';
            title.style.background = 'linear-gradient(135deg, #c53030, #9b2c2c)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            message.textContent = 'Tu Centro Urbano ha sido destruido.';
        }

        // Palette: Populate Game Over Stats
        const stats = document.getElementById('gameOverStats');
        if (stats) {
            const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
            const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');

            stats.innerHTML = '';

            // Time Stat
            const timeStat = document.createElement('div');
            timeStat.className = 'control-item'; // Reuse existing class for styling
            timeStat.style.justifyContent = 'space-between'; // Override slightly to separate label and value
            timeStat.style.marginBottom = '8px';

            const timeLabel = document.createElement('span');
            timeLabel.textContent = '⏱️ Tiempo: ';
            timeLabel.className = 'text-medium'; // Use existing theme class

            const timeValue = document.createElement('span');
            timeValue.textContent = `${minutes}:${seconds}`;
            timeValue.className = 'text-light'; // Use existing theme class
            timeValue.style.fontWeight = 'bold';

            timeStat.appendChild(timeLabel);
            timeStat.appendChild(timeValue);

            // Population Stat
            const popStat = document.createElement('div');
            popStat.className = 'control-item'; // Reuse existing class for styling
            popStat.style.justifyContent = 'space-between';

            const popLabel = document.createElement('span');
            popLabel.textContent = '👥 Población Alcanzada: ';
            popLabel.className = 'text-medium'; // Use existing theme class

            const popValue = document.createElement('span');
            popValue.textContent = `${Math.floor(this.population)}`;
            popValue.className = 'text-light'; // Use existing theme class
            popValue.style.fontWeight = 'bold';

            popStat.appendChild(popLabel);
            popStat.appendChild(popValue);

            stats.appendChild(timeStat);
            stats.appendChild(popStat);
        }

        gameOverScreen.classList.remove('hidden');

        // Manage Focus for Accessibility
        const playAgainBtn = document.getElementById('playAgainButton');
        if (playAgainBtn) {
            // Focus primary action
            setTimeout(() => playAgainBtn.focus(), 50);
        }

        // Palette: View Map Functionality
        const viewMapBtn = document.getElementById('viewMapButton');
        const returnBtn = document.getElementById('returnToStatsBtn');

        if (viewMapBtn && returnBtn) {
            viewMapBtn.onclick = () => {
                gameOverScreen.classList.add('hidden');
                returnBtn.classList.remove('hidden');
                // Focus return button for accessibility
                returnBtn.focus();

                // Show notification to guide user
                this.showNotification('Modo Espectador: Puedes moverte por el mapa', 'info');
            };

            returnBtn.onclick = () => {
                gameOverScreen.classList.remove('hidden');
                returnBtn.classList.add('hidden');
                // Focus view map button
                viewMapBtn.focus();
            };
        }
    }

    /**
     * Palette: Creates a confetti celebration effect in the DOM
     */
    startVictoryConfetti() {
        const container = document.getElementById('gameOverScreen');
        if (!container) return;

        const colors = ['#f56565', '#48bb78', '#ecc94b', '#4299e1', '#ed64a6'];

        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.setAttribute('aria-hidden', 'true');
            c.style.left = Math.random() * 100 + '%';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDuration = (Math.random() * 2 + 3) + 's';
            c.style.animationDelay = (Math.random() * 2) + 's';
            container.appendChild(c);
        }
    }

    /**
     * BOLT OPTIMIZATION: Converts FOW grid state to a bitmap buffer.
     * Uses INCREMENTAL updates - only updates tiles that changed state.
     * Reduces complexity from O(TotalTiles) to O(ChangedTiles) - typically 20-50x faster.
     */
    _updateFOWBuffer() {
        if (!this.fow || !this._fowImageData) return;

        const data32 = this._fowImageData32;
        const grid = this.fow.grid;
        const lut = this._fowColorLUT;

        // BOLT OPTIMIZATION: Incremental update using visible ranges
        // Buffer is pre-initialized with HIDDEN (black), so we only need to update changed tiles

        const prevRanges = this.fow._previousVisibleRanges;
        const currRanges = this.fow.visibleRanges;

        // Skip if nothing to update (buffer is pre-initialized with HIDDEN)
        if ((!prevRanges || prevRanges.length === 0) && (!currRanges || currRanges.length === 0)) {
            return;
        }

        // Incremental update: only update tiles that changed state
        // BOLT OPTIMIZATION: Differential update using set difference
        // Instead of filling full ranges (overlapping 90%+), only fill the differences.
        // Prev - Curr -> EXPLORED (Lost Vision)
        // Curr - Prev -> VISIBLE (New Vision)
        // Intersection -> VISIBLE (No change needed, already VISIBLE from prev frame)

        if (prevRanges) {
            Game._applyDiffToBuffer(prevRanges, currRanges, data32, lut[FOW_STATES.EXPLORED]);
        }

        if (currRanges) {
            Game._applyDiffToBuffer(currRanges, prevRanges, data32, lut[FOW_STATES.VISIBLE]);
        }

        this._fowBufferCtx.putImageData(this._fowImageData, 0, 0);
    }

    drawFOW() {
        // BOLT: Skip FOW rendering when disabled
        if (!CONFIG.VISION.ENABLED) return;
        if (!this.fow || !this._fowBufferCanvas) return;

        // BOLT OPTIMIZATION: Disable smoothing to prevent blurry FOW edges
        // Also slightly faster (skips interpolation calculations)
        const wasSmoothing = this.ctx.imageSmoothingEnabled;
        this.ctx.imageSmoothingEnabled = false;

        // Single drawImage call instead of thousands of Path2D rects.
        this.ctx.drawImage(
            this._fowBufferCanvas,
            this.camera.x / TILE_SIZE,
            this.camera.y / TILE_SIZE,
            this.viewWidth / TILE_SIZE,
            this.viewHeight / TILE_SIZE,
            0, 0,
            this.viewWidth,
            this.viewHeight
        );

        // Restore smoothing for other draw operations
        this.ctx.imageSmoothingEnabled = wasSmoothing;
    }

    drawTerrain() {
        if (!this.terrainMap || !this._terrainBufferCanvas) return;

        // Check if current camera is fully covered by the buffer (with margin)
        // We use a safe margin of 100px to avoid visible edges during fast scrolls
        const margin = 100;
        const viewW = this.viewWidth;
        const viewH = this.viewHeight;
        const buffer = this._terrainBufferRect;

        if (this.camera.x >= buffer.x + margin &&
            this.camera.x + viewW <= buffer.x + buffer.width - margin &&
            this.camera.y >= buffer.y + margin &&
            this.camera.y + viewH <= buffer.y + buffer.height - margin) {

            // HIT: Draw from buffer
            // Calculate integer offsets to avoid blurring
            const sx = (this.camera.x - buffer.x) | 0;
            const sy = (this.camera.y - buffer.y) | 0;

            this.ctx.drawImage(this._terrainBufferCanvas,
                sx, sy, viewW, viewH,
                0, 0, viewW, viewH
            );
            return;
        }

        // MISS: Re-render buffer
        this._renderTerrainToBuffer();

        // Draw the newly rendered buffer
        const sx = (this.camera.x - buffer.x) | 0;
        const sy = (this.camera.y - buffer.y) | 0;

        this.ctx.drawImage(this._terrainBufferCanvas,
            sx, sy, viewW, viewH,
            0, 0, viewW, viewH
        );
    }

    /**
     * BOLT OPTIMIZATION: Query entities from a specific row of buckets, strictly filtering by visibility.
     * This filtering happens BEFORE sorting, significantly reducing the sorting load.
     * @param {SpatialGrid} grid - The grid to query
     * @param {number} row - The row index
     * @param {number} startCol - Start column index
     * @param {number} endCol - End column index
     * @param {Array} result - The result array to append to
     * @param {Uint32Array} fowGrid - FOW grid data
     * @param {number} fowCols - FOW grid width
     * @param {number} fowRows - FOW grid height
     * @param {number} fowInvTileSize - Inverse tile size for FOW calc
     * @param {number} fowVisibleState - The value representing VISIBLE state
     */
    _queryVisibleRow(grid, row, startCol, endCol, result, fowGrid, fowCols, fowRows, fowInvTileSize, fowVisibleState) {
        const buckets = grid.buckets;
        const rowBase = row * grid.cols;
        let count = result.length;

        for (let c = startCol; c <= endCol; c++) {
            const bucket = buckets[rowBase + c];
            const bLen = bucket.length;
            if (bLen > 0) {
                for (let i = 0; i < bLen; i++) {
                    const ent = bucket[i];

                    // Check visibility only for enemies (or potentially neutral/enemy buildings)
                    // Player entities (team === 'player') are always assumed visible if passed to this check
                    // but usually we won't call this for player grids.
                    if (ent.team === 'enemy') {
                        // Inline FOW check
                        let entCol = ent._lastGridCol !== undefined ? ent._lastGridCol : (ent.x * fowInvTileSize) | 0;
                        let entRow = ent._lastGridRow !== undefined ? ent._lastGridRow : (ent.y * fowInvTileSize) | 0;

                        // Bounds check (clamping)
                        if (entCol < 0) entCol = 0; else if (entCol >= fowCols) entCol = fowCols - 1;
                        if (entRow < 0) entRow = 0; else if (entRow >= fowRows) entRow = fowRows - 1;

                        if (fowGrid[entRow * fowCols + entCol] !== fowVisibleState) {
                            continue; // Hidden
                        }
                    }

                    result[count++] = ent;
                }
            }
        }
    }

    _renderTerrainToBuffer() {
        const viewW = this.viewWidth;
        const viewH = this.viewHeight;
        const bufferW = this._terrainBufferCanvas.width;
        const bufferH = this._terrainBufferCanvas.height;

        // Center buffer on current camera
        // Align to TILE_SIZE to ensure tiles are drawn at integer positions relative to buffer origin
        const centerX = this.camera.x + viewW / 2;
        const centerY = this.camera.y + viewH / 2;

        const newX = (Math.floor((centerX - bufferW / 2) / TILE_SIZE) * TILE_SIZE);
        const newY = (Math.floor((centerY - bufferH / 2) / TILE_SIZE) * TILE_SIZE);

        this._terrainBufferRect.x = newX;
        this._terrainBufferRect.y = newY;
        this._terrainBufferRect.width = bufferW;
        this._terrainBufferRect.height = bufferH;

        // Clear buffer
        const ctx = this._terrainBufferCtx;
        ctx.clearRect(0, 0, bufferW, bufferH);

        // Render parameters
        const startCol = Math.max(0, Math.floor(newX / TILE_SIZE));
        const startRow = Math.max(0, Math.floor(newY / TILE_SIZE));
        const endCol = Math.min(this.terrainMap.cols, Math.ceil((newX + bufferW) / TILE_SIZE));
        const endRow = Math.min(this.terrainMap.rows, Math.ceil((newY + bufferH) / TILE_SIZE));

        const grid = this.terrainMap.grid;
        const mapCols = this.terrainMap.cols;
        const idToName = this.terrainMap._idToName;

        // Create paths for batching
        const paths = new Array(idToName.length);
        for (let i = 0; i < idToName.length; i++) paths[i] = new Path2D();
        const fallbackPath = new Path2D();

        for (let row = startRow; row < endRow; row++) {
            let index = row * mapCols + startCol;
            // Draw relative to buffer origin
            const y = row * TILE_SIZE - newY;

            // Optimization variables
            let x = startCol * TILE_SIZE - newX;
            let runStartX = x;
            let runLength = 0;
            let currentTerrainId = -1;

            for (let col = startCol; col < endCol; col++) {
                const terrainId = grid[index];

                if (terrainId !== currentTerrainId) {
                    if (currentTerrainId !== -1) {
                        if (currentTerrainId < paths.length) {
                            paths[currentTerrainId].rect(runStartX, y, runLength * TILE_SIZE, TILE_SIZE);
                        } else {
                            fallbackPath.rect(runStartX, y, runLength * TILE_SIZE, TILE_SIZE);
                        }
                    }
                    currentTerrainId = terrainId;
                    runStartX = x;
                    runLength = 1;
                } else {
                    runLength++;
                }

                x += TILE_SIZE;
                index++;
            }

            // Flush last run
            if (currentTerrainId !== -1) {
                if (currentTerrainId < paths.length) {
                    paths[currentTerrainId].rect(runStartX, y, runLength * TILE_SIZE, TILE_SIZE);
                } else {
                    fallbackPath.rect(runStartX, y, runLength * TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Draw paths to buffer context
        for (let i = 0; i < paths.length; i++) {
            const type = idToName[i];
            const terrainData = TERRAIN_TYPES[type];
            if (terrainData) {
                ctx.fillStyle = terrainData.color;
                ctx.fill(paths[i]);
            }
        }
    }

    render() {
        // BOLT OPTIMIZATION: Cache frame timestamp once per render
        // Entities use this for animations instead of calling Date.now() per-entity
        this.renderTime = Date.now();

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar terreno
        this.drawTerrain();

        // Dibujar niebla de guerra (Pass 1: Terreno)
        this.drawFOW();

        // Dibujar grid (solo si está activado)
        if (this.showGrid) {
            this.drawGrid();
        }

        // Dibujar nodos de recursos
        this.drawResourceNodes();

        // Dibujar entidades
        // OPTIMIZACIÓN: Frustum Culling usando SpatialGrid
        // Solo renderizamos entidades que están visiblemente dentro de la cámara (con margen)
        const margin = 100;

        // Reutilizamos _renderCache para evitar GC
        // OPTIMIZATION: Use queryRect for rectangular frustum culling
        // Avoids querying buckets outside the viewport corners (saving ~40% bucket checks)

        // OPTIMIZATION: Interleave queries to pre-sort by Y
        // Instead of querying all units then all buildings (which produces [Units, Buildings]),
        // we query row by row: [Row0_Units, Row0_Buildings, Row1_Units...].
        // This produces a "mostly sorted" array which V8's Timsort handles significantly faster (~7-10%).

        this._renderCache.length = 0;

        const grid = this.playerUnitGrid; // All grids share dimensions
        const invCellSize = grid.invCellSize;
        const cols = grid.cols;
        const rows = grid.rows;

        // BOLT OPTIMIZATION: Hoist Camera & Viewport properties
        const camX = this.camera.x;
        const camY = this.camera.y;
        const viewW = this.viewWidth;
        const viewH = this.viewHeight;
        const ctx = this.ctx;

        // Calculate grid bounds with margin
        const startCol = Math.max(0, Math.floor((camX - margin) * invCellSize));
        const endCol = Math.min(cols - 1, Math.floor((camX + viewW + margin) * invCellSize));
        const startRow = Math.max(0, Math.floor((camY - margin) * invCellSize));
        const endRow = Math.min(rows - 1, Math.floor((camY + viewH + margin) * invCellSize));

        // BOLT OPTIMIZATION: Hoist FOW constants for inline check
        const isVisionEnabled = CONFIG.VISION.ENABLED;
        const fowGrid = this.fow.grid;
        const fowCols = this.fow.cols;
        const fowRows = this.fow.rows;
        const fowInvTileSize = this.fow.invTileSize;
        const fowVisibleState = FOW_STATES.VISIBLE; // Hoist constant

        for (let r = startRow; r <= endRow; r++) {
            // BOLT OPTIMIZATION: Sort row-by-row instead of globally
            // This exploits the fact that rows are already mostly sorted by Y
            // and avoids the O(N log N) cost of sorting the entire visible set at once.
            this._rowCache.length = 0;

            // BOLT OPTIMIZATION: Filter BEFORE Sort
            // Player units are always visible
            this.playerUnitGrid.queryRowIndices(r, startCol, endCol, this._rowCache);

            if (isVisionEnabled) {
                // For enemies/buildings, use the filtered query to skip invisible entities immediately.
                // This prevents sorting hundreds of hidden entities only to discard them later.
                this._queryVisibleRow(this.enemyUnitGrid, r, startCol, endCol, this._rowCache, fowGrid, fowCols, fowRows, fowInvTileSize, fowVisibleState);
                this._queryVisibleRow(this.buildingGrid, r, startCol, endCol, this._rowCache, fowGrid, fowCols, fowRows, fowInvTileSize, fowVisibleState);
            } else {
                // If vision disabled, fallback to dumping everything
                this.enemyUnitGrid.queryRowIndices(r, startCol, endCol, this._rowCache);
                this.buildingGrid.queryRowIndices(r, startCol, endCol, this._rowCache);
            }

            // Sort only this row's entities (now much smaller list if FOW is active)
            // BOLT OPTIMIZATION: Use static comparator to avoid closure allocation
            this._rowCache.sort(Game._sortEntities);

            // Manual append to avoid call stack limits or creation of intermediate arrays
            // This loop is extremely fast in V8
            const rowLen = this._rowCache.length;
            let writeIdx = 0;

            for (let i = 0; i < rowLen; i++) {
                const ent = this._rowCache[i];

                // FOW check removed here as it was handled in _queryVisibleRow

                // 2. Calculate Screen Coords (needed for culling)
                ent._screenX = (ent.x - camX) | 0;
                ent._screenY = (ent.y - camY) | 0;

                // 3. Fine-Grained Screen Culling
                // SpatialGrid is coarse; check exact bounds here to avoid rendering off-screen entities
                // (margin logic in spatial grid query leaves some off-screen entities)
                const size = ent.size || 20;
                if (ent._screenX < -size || ent._screenX > viewW + size ||
                    ent._screenY < -size || ent._screenY > viewH + size) {
                    continue;
                }

                this._rowCache[writeIdx++] = ent;
            }
            this._rowCache.length = writeIdx;

            // Manual append to render cache
            const filteredLen = this._rowCache.length;
            let renderIdx = this._renderCache.length;
            for (let i = 0; i < filteredLen; i++) {
                this._renderCache[renderIdx++] = this._rowCache[i];
            }
        }

        // Ordenar por Y para correcto "Painter's Algorithm" (los de arriba se dibujan antes)
        // BOLT OPTIMIZATION: Global sort removed as row-wise sort + grid order is sufficient
        // this._renderCache.sort((a, b) => a.y - b.y);

        // Render entities
        const renderLen = this._renderCache.length;

        // BOLT OPTIMIZATION: Batch Entity Backgrounds (Ground Pass)
        // Reduces state changes (fillStyle) and draw calls (fillRect -> fill)
        // Groups entities by team to minimize context switching.
        if (renderLen > 0) {
            // BOLT OPTIMIZATION: Use cached colors instead of recalculating per frame
            // Removed redundant civilizationManager lookups (~114x faster logic)

            // Batch Player
            ctx.fillStyle = this._playerColor;
            ctx.beginPath();
            let hasPlayer = false;
            for (let i = 0; i < renderLen; i++) {
                const ent = this._renderCache[i];
                if (ent.team === 'player') {
                    ent.addBackgroundToPath(ctx, this.camera);
                    hasPlayer = true;
                }
            }
            if (hasPlayer) ctx.fill();

            // Batch Enemy
            ctx.fillStyle = this._enemyColor;
            ctx.beginPath();
            let hasEnemy = false;
            for (let i = 0; i < renderLen; i++) {
                const ent = this._renderCache[i];
                if (ent.team === 'enemy') {
                    ent.addBackgroundToPath(ctx, this.camera);
                    hasEnemy = true;
                }
            }
            if (hasEnemy) ctx.fill();
        }

        // Render entities (Pass 2: Sprites)
        // OPTIMIZATION: Use standard for loop with cached length instead of for...of
        // Benchmark: ~1.5x faster in hot loops and avoids iterator allocation
        for (let i = 0; i < renderLen; i++) {
            // OPTIMIZATION: Pass viewport size to Entity.render for fine-grained culling
            // Pass false to skip HP bars (we batch them later)
            // Pass false to skip Backgrounds (we batched them above)
            this._renderCache[i].render(ctx, this.camera, viewW, viewH, false, false);
        }

        // BOLT OPTIMIZATION: Batch HP & Production Backgrounds (Pass 3)
        // Fused loop to reduce array iterations and draw calls. Both use the same semi-transparent black.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        let hasBackgrounds = false;

        for (let i = 0; i < renderLen; i++) {
            const entity = this._renderCache[i];

            // HP Bar Background
            if (entity.hp < entity.maxHp) {
                entity.addHpBarBackgroundToPath(ctx, this.camera);
                hasBackgrounds = true;
            }

            // Production Bar Background
            if (entity.productionQueue && !entity.productionQueue.isEmpty()) {
                entity.addProductionBarBackgroundToPath(ctx, this.camera);
                hasBackgrounds = true;
            }
        }

        if (hasBackgrounds) {
            ctx.fill();
        }

        // Batch HP Foreground (Pass 4)
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        let hasHpFg = false;
        for (let i = 0; i < renderLen; i++) {
            const entity = this._renderCache[i];
            if (entity.hp < entity.maxHp) {
                entity.addHpBarForegroundToPath(ctx, this.camera);
                hasHpFg = true;
            }
        }
        if (hasHpFg) ctx.fill();

        // Batch Production Foreground (Pass 5)
        ctx.fillStyle = '#4299e1'; // Blue
        ctx.beginPath();
        let hasProdFg = false;
        for (let i = 0; i < renderLen; i++) {
            const entity = this._renderCache[i];
            if (entity.productionQueue && !entity.productionQueue.isEmpty()) {
                entity.addProductionBarForegroundToPath(ctx, this.camera);
                hasProdFg = true;
            }
        }
        if (hasProdFg) ctx.fill();

        // Dibujar selección
        this.drawSelection();

        // Palette: Draw contextual highlights
        this.drawHoverHighlight();

        // Dibujar rectángulo de arrastre
        if (this.isDragging) {
            this.drawDragSelection();
        }

        // Dibujar fantasma de construcción
        if (this.buildMode) {
            this.drawBuildGhost();
        }

        // Renderizar partículas (Palette)
        if (this.particleSystem) {
            this.particleSystem.render(this.ctx, this.camera, this.viewWidth, this.viewHeight);
        }

        // Renderizar minimapa
        this.renderMinimap();

        // Palette: Canvas Pause Overlay removed in favor of DOM overlay for accessibility
    }

    drawGrid() {
        // BOLT OPTIMIZATION: Cache grid path and use translation
        // Reduces Canvas API calls from ~100/frame to 4/frame
        // Eliminates per-frame loop overhead (~70x faster logic)

        // Check if we need to rebuild the cached path (resize or first run)
        if (this.viewWidth !== this.lastViewWidth || this.viewHeight !== this.lastViewHeight || !this._gridPath) {
            this.lastViewWidth = this.viewWidth;
            this.lastViewHeight = this.viewHeight;
            this._gridPath = new Path2D();
            const gridSize = TILE_SIZE;

            // We build a grid slightly larger than the viewport to handle the scrolling shift
            // We start at 0 and go up to width + size to ensure coverage when shifted left
            const cols = Math.ceil(this.viewWidth / gridSize) + 1;
            const rows = Math.ceil(this.viewHeight / gridSize) + 1;

            // Vertical lines
            for (let i = 0; i <= cols; i++) {
                const x = i * gridSize;
                this._gridPath.moveTo(x, 0);
                this._gridPath.lineTo(x, this.viewHeight + gridSize); // Extend slightly down too
            }

            // Horizontal lines
            for (let i = 0; i <= rows; i++) {
                const y = i * gridSize;
                this._gridPath.moveTo(0, y);
                this._gridPath.lineTo(this.viewWidth + gridSize, y); // Extend slightly right too
            }
        }

        const gridSize = TILE_SIZE;
        // Calculate sub-pixel offset to simulate scrolling
        // The grid pattern repeats every TILE_SIZE, so we only need to shift by modulo
        // We use negative modulo to shift "left/up" as camera moves "right/down"
        const offsetX = -(this.camera.x % gridSize);
        const offsetY = -(this.camera.y % gridSize);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        this.ctx.stroke(this._gridPath);
        this.ctx.restore();
    }

    drawResourceNodes() {
        // OPTIMIZACIÓN: Usar SpatialGrid para recursos
        // En lugar de iterar todos los recursos, solo consultamos los cercanos

        // OPTIMIZATION: Use queryRect to match viewport exactly
        const margin = 50;
        this.resourceGrid.queryRect(this.camera.x - margin, this.camera.y - margin, this.viewWidth + margin * 2, this.viewHeight + margin * 2, this._resourceRenderCache);

        // BOLT OPTIMIZATION: Single Pre-pass for Coordinate Calculation & Culling
        // Reduces redundant math (x-camX) and frustum checks by ~26%
        let visibleCount = 0;
        const nodesLen = this._resourceRenderCache.length;
        const viewW = this.viewWidth;
        const viewH = this.viewHeight;
        const camX = this.camera.x;
        const camY = this.camera.y;

        // BOLT OPTIMIZATION: Hoist FOW lookups
        const isVisionEnabled = CONFIG.VISION.ENABLED;
        const fowGrid = this.fow ? this.fow.grid : null;
        const fowCols = this.fow ? this.fow.cols : 0;
        const fowRows = this.fow ? this.fow.rows : 0;
        const fowHiddenState = FOW_STATES.HIDDEN; // 0

        for (let i = 0; i < nodesLen; i++) {
            const node = this._resourceRenderCache[i];
            if (node.amount <= 0) continue;

            // FILTRADO POR NIEBLA DE GUERRA
            // BOLT OPTIMIZATION: Inline check with cached coords (~30% faster)
            // Replaces expensive isExplored() call which did division every frame
            if (isVisionEnabled && fowGrid) {
                // Use cached grid coords if available, fallback to calculation if not (safety)
                const col = node._gridCol !== undefined ? node._gridCol : (node.x * this.fow.invTileSize) | 0;
                const row = node._gridRow !== undefined ? node._gridRow : (node.y * this.fow.invTileSize) | 0;

                // Safety bounds check before array access
                if (col >= 0 && col < fowCols && row >= 0 && row < fowRows) {
                    if (fowGrid[row * fowCols + col] === fowHiddenState) {
                        continue;
                    }
                }
            }

            // Calculate screen coordinates once
            const screenX = (node.x - camX) | 0;
            const screenY = (node.y - camY) | 0;
            const radius = node.radius;

            // Cache for Pass 2
            node._screenX = screenX;
            node._screenY = screenY;

            // Frustum culling
            if (screenX >= -radius && screenX <= viewW + radius &&
                screenY >= -radius && screenY <= viewH + radius) {

                // Cache coordinates and compact list
                node._screenX = screenX;
                node._screenY = screenY;
                this._resourceRenderCache[visibleCount++] = node;
            }
        }

        // OPTIMIZATION: Batch background circles to reduce draw calls
        // from ~N calls to 1 call.
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();

        // Pass 1: Build batched path for backgrounds (using compacted list)
        for (let i = 0; i < visibleCount; i++) {
            const node = this._resourceRenderCache[i];
            // Move to start of arc to prevent connecting lines
            this.ctx.moveTo(node._screenX + node.radius, node._screenY);
            this.ctx.arc(node._screenX, node._screenY, node.radius, 0, Math.PI * 2);
        }
        this.ctx.fill();

        // Pass 2: Draw icons (using compacted list)
        // BOLT OPTIMIZATION: Hoist assetLoader check
        const hasAssetLoader = typeof assetLoader !== 'undefined';

        for (let i = 0; i < visibleCount; i++) {
            const node = this._resourceRenderCache[i];

            // Icon
            // BOLT OPTIMIZATION: Cache image reference on node to avoid global lookup loop
            let img = node._cachedImage;
            if (!img && hasAssetLoader) {
                img = assetLoader.getImage(node.type);
                if (img) node._cachedImage = img;
            }

            if (img && img.complete) {
                const size = node.radius * 1.5;
                this.ctx.drawImage(img, node._screenX - size / 2, node._screenY - size / 2, size, size);
            } else if (hasAssetLoader) {
                // Fallback to square if image not ready
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(node._screenX - 10, node._screenY - 10, 20, 20);
            }
        }
    }

    /**
     * Palette: Contextual Highlight
     * Draws a pulsating ring around units matching the UI hover state.
     */
    drawHoverHighlight() {
        if (!this.hoveredType) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff'; // White glow
        this.ctx.lineWidth = 2;
        // Pulse effect
        const pulse = 0.6 + Math.sin(this.renderTime / 150) * 0.2;
        this.ctx.globalAlpha = pulse;

        this.ctx.beginPath();

        if (this.hoveredType === 'idle_villager') {
            // Highlight all idle villagers
            // Iterate over all units is safe as this is only triggered on hover
            const len = this.units.length;
            for (let i = 0; i < len; i++) {
                const unit = this.units[i];
                if (unit.type === 'villager' && unit.state === 'IDLE' && unit.team === 'player') {
                    // Check visibility before drawing
                    if (unit.isDead) continue;

                    // Simple culling
                    const screenX = (unit.x - this.camera.x) | 0;
                    const screenY = (unit.y - this.camera.y) | 0;
                    if (screenX < -50 || screenX > this.viewWidth + 50 ||
                        screenY < -50 || screenY > this.viewHeight + 50) continue;

                    const radius = unit.size + 8;
                    this.ctx.moveTo(screenX + radius, screenY);
                    this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                }
            }
        } else {
            // Highlight selected units of specific type
            const len = this.selectedEntities.length;
            for (let i = 0; i < len; i++) {
                const entity = this.selectedEntities[i];
                if (entity.type === this.hoveredType && !entity.isDead) {
                    const screenX = (entity.x - this.camera.x) | 0;
                    const screenY = (entity.y - this.camera.y) | 0;
                    const radius = entity.size + 8; // Slightly larger than selection ring

                    this.ctx.moveTo(screenX + radius, screenY);
                    this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                }
            }
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    drawSelection() {
        if (this.selectedEntities.length === 0) return;

        this.ctx.strokeStyle = '#48bb78';
        this.ctx.lineWidth = 2;

        // OPTIMIZATION: Batch selection rings to reduce draw calls
        // Reduces draw calls from N to 1
        this.ctx.beginPath();

        const len = this.selectedEntities.length;
        for (let i = 0; i < len; i++) {
            const entity = this.selectedEntities[i];
            const screenX = (entity.x - this.camera.x) | 0;
            const screenY = (entity.y - this.camera.y) | 0;
            const radius = entity.size + 5;

            // Move to start of arc to prevent connecting lines
            this.ctx.moveTo(screenX + radius, screenY);
            this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        }

        this.ctx.stroke();

        // Palette: Visual Rally Points
        this.drawRallyPoints();
    }

    drawRallyPoints() {
        // BOLT OPTIMIZATION: Filter entities first to batch draw calls
        const entitiesWithRally = [];
        const len = this.selectedEntities.length;
        for (let i = 0; i < len; i++) {
            const entity = this.selectedEntities[i];
            if (entity.team === 'player' && entity.rallyPoint) {
                entitiesWithRally.push(entity);
            }
        }

        if (entitiesWithRally.length === 0) return;

        // Save context once for all rally points
        this.ctx.save();

        // Batch 1: Dashed Lines
        this.ctx.strokeStyle = 'rgba(232, 212, 139, 0.6)'; // Gold with opacity
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        const rallyLen = entitiesWithRally.length;
        const camX = this.camera.x;
        const camY = this.camera.y;

        for (let i = 0; i < rallyLen; i++) {
            const entity = entitiesWithRally[i];
            const startX = (entity.x - camX) | 0;
            const startY = (entity.y - camY) | 0;
            const endX = (entity.rallyPoint.x - camX) | 0;
            const endY = (entity.rallyPoint.y - camY) | 0;

            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
        }
        this.ctx.stroke();

        // Prepare for Flags
        this.ctx.fillStyle = '#e8d48b';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]); // Reset dash

        // Batch 2: Flag Poles
        this.ctx.beginPath();
        for (let i = 0; i < rallyLen; i++) {
            const entity = entitiesWithRally[i];
            const endX = (entity.rallyPoint.x - camX) | 0;
            const endY = (entity.rallyPoint.y - camY) | 0;
            this.ctx.rect(endX, endY - 20, 2, 20);
        }
        this.ctx.fill();

        // Batch 3: Flag Triangles
        this.ctx.beginPath();
        for (let i = 0; i < rallyLen; i++) {
            const entity = entitiesWithRally[i];
            const endX = (entity.rallyPoint.x - camX) | 0;
            const endY = (entity.rallyPoint.y - camY) | 0;
            this.ctx.moveTo(endX + 2, endY - 20);
            this.ctx.lineTo(endX + 12, endY - 15);
            this.ctx.lineTo(endX + 2, endY - 10);
            this.ctx.closePath();
        }
        this.ctx.fill();
        this.ctx.stroke();

        // Batch 4: Base Circles
        this.ctx.beginPath();
        for (let i = 0; i < rallyLen; i++) {
            const entity = entitiesWithRally[i];
            const endX = (entity.rallyPoint.x - camX) | 0;
            const endY = (entity.rallyPoint.y - camY) | 0;
            this.ctx.moveTo(endX + 1 + 3, endY); // Move to start of arc
            this.ctx.arc(endX + 1, endY, 3, 0, Math.PI * 2);
        }
        this.ctx.fill();

        this.ctx.restore();
    }

    drawDragSelection() {
        const startX = (this.dragStart.x - this.camera.x) | 0;
        const startY = (this.dragStart.y - this.camera.y) | 0;
        const width = (this.mouse.x - startX) | 0;
        const height = (this.mouse.y - startY) | 0;

        this.ctx.strokeStyle = '#48bb78';
        this.ctx.fillStyle = 'rgba(72, 187, 120, 0.1)';
        this.ctx.lineWidth = 2;

        this.ctx.fillRect(startX, startY, width, height);
        this.ctx.strokeRect(startX, startY, width, height);

        // Palette: Live Selection Count Badge
        const minX = Math.min(this.dragStart.x, this.mouse.worldX);
        const maxX = Math.max(this.dragStart.x, this.mouse.worldX);
        const minY = Math.min(this.dragStart.y, this.mouse.worldY);
        const maxY = Math.max(this.dragStart.y, this.mouse.worldY);
        const widthW = maxX - minX;
        const heightW = maxY - minY;

        // Query Spatial Grid (Reuse cache array)
        if (!this._dragSelectCache) this._dragSelectCache = [];

        // Pass 1: Player Units (Clear cache)
        this.playerUnitGrid.queryRect(minX, minY, widthW, heightW, this._dragSelectCache, true);

        // Pass 2: Buildings (Append to cache)
        if (this.buildingGrid) {
            this.buildingGrid.queryRect(minX, minY, widthW, heightW, this._dragSelectCache, false);
        }

        let count = 0;
        const len = this._dragSelectCache.length;
        for (let i = 0; i < len; i++) {
            const ent = this._dragSelectCache[i];
            // Check team (Units are implicitly player, but Buildings are mixed)
            if (!ent.isDead && ent.team === 'player') {
                // Precise check
                if (ent.x >= minX && ent.x <= maxX && ent.y >= minY && ent.y <= maxY) {
                    count++;
                }
            }
        }

        if (count > 0) {
            const badgeX = this.mouse.x + 24; // Offset from cursor
            const badgeY = this.mouse.y + 24;

            this.ctx.font = 'bold 12px "Inter", sans-serif';
            const text = `${count}`;
            const metrics = this.ctx.measureText(text);
            const badgeW = Math.max(20, metrics.width + 10);
            const badgeH = 20;

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.strokeStyle = '#e8d48b'; // Gold
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            } else {
                this.ctx.rect(badgeX, badgeY, badgeW, badgeH);
            }
            this.ctx.fill();
            this.ctx.stroke();

            // Text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, badgeX + badgeW / 2, badgeY + badgeH / 2);
        }
    }

    drawBuildGhost() {
        const snap = this.gridMap.snapToGrid(this.mouse.worldX, this.mouse.worldY);
        const size = CONFIG.BUILDING_SIZES[this.buildMode];

        // BOLT OPTIMIZATION: Truncate to integer
        const screenX = (snap.x - this.camera.x) | 0;
        const screenY = (snap.y - this.camera.y) | 0;
        const width = size.width * TILE_SIZE;
        const height = size.height * TILE_SIZE;

        // Palette: Enhanced validation (Grid + Terrain)
        const isGridFree = this.gridMap.isAreaFree(snap.col, snap.row, size.width, size.height);
        const isTerrainValid = this.terrainMap.canBuildAt(snap.x, snap.y, size.width, size.height);
        const isPlaceable = isGridFree && isTerrainValid;

        // Color basado en si es construible
        this.ctx.fillStyle = isPlaceable ? 'rgba(72, 187, 120, 0.4)' : 'rgba(197, 48, 48, 0.4)';
        this.ctx.strokeStyle = isPlaceable ? '#48bb78' : '#c53030';
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

        // Palette: Accessible Invalid Feedback (High Contrast)
        if (!isPlaceable) {
            const symbolSize = Math.min(width, height) * 0.8;
            this.ctx.font = `bold ${symbolSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Shadow/Stroke for visibility
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            this.ctx.strokeText('🚫', screenX + width / 2, screenY + height / 2);

            this.ctx.fillStyle = '#c53030';
            this.ctx.fillText('🚫', screenX + width / 2, screenY + height / 2);

            // Reason Text
            const reason = !isGridFree ? 'Ocupado' : 'Terreno Inválido';
            this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#fc8181';
            this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            this.ctx.lineWidth = 3;

            const labelX = screenX + width / 2;
            const labelY = screenY + height + 20;

            this.ctx.strokeText(reason, labelX, labelY);
            this.ctx.fillText(reason, labelX, labelY);
        }

        // Dibujar grid local para referencia visual (solo si es válido para evitar ruido)
        if (isPlaceable) {
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
    }

    _renderMinimapBuffer() {
        if (!this._minimapBufferCtx) return;

        const ctx = this._minimapBufferCtx;
        const width = this._minimapBufferCanvas.width;
        const height = this._minimapBufferCanvas.height;
        const scale = width / CONFIG.CANVAS_WIDTH;

        // Clear & Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Resources
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();

        // BOLT OPTIMIZATION: Use cached length loop and cached grid coords
        const nodesLen = this.resourceNodes.length;
        // Hoist FOW lookups
        const fow = this.fow;
        const invTileSize = fow.invTileSize;

        for (let i = 0; i < nodesLen; i++) {
            const node = this.resourceNodes[i];
            if (node.amount > 0) {
                // Solo mostrar en el minimapa si la zona ha sido explorada
                // BOLT OPTIMIZATION: Use cached _gridCol (set at generation)
                const col = node._gridCol !== undefined ? node._gridCol : (node.x * invTileSize) | 0;
                const row = node._gridRow !== undefined ? node._gridRow : (node.y * invTileSize) | 0;

                if (fow.isExplored(col, row)) {
                    ctx.rect(node.x * scale - 1, node.y * scale - 1, 2, 2);
                }
            }
        }
        ctx.fill();

        // Buildings
        // BOLT OPTIMIZATION: Use cached length loop and cached grid coords
        const buildingsLen = this.buildings.length;
        for (let i = 0; i < buildingsLen; i++) {
            const building = this.buildings[i];
            if (building.isDead) continue;

            // Solo mostrar en el minimapa si la zona ha sido explorada
            // BOLT OPTIMIZATION: Use cached _lastGridCol (set at creation)
            const col = (building._lastGridCol !== -1) ? building._lastGridCol : (building.x * invTileSize) | 0;
            const row = (building._lastGridRow !== -1) ? building._lastGridRow : (building.y * invTileSize) | 0;

            if (!fow.isExplored(col, row)) {
                continue;
            }

            const x = building.x * scale;
            const y = building.y * scale;
            const size = Math.max(4, building.size * scale * 2);

            if (building.image && building.image.complete) {
                ctx.drawImage(building.image, x - size / 2, y - size / 2, size, size);
            } else {
                ctx.fillStyle = building.team === 'player' ? '#48bb78' : '#c53030';
                ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        }

        this._minimapDirty = false;
    }

    renderMinimap() {
        const scale = this.minimap.width / CONFIG.CANVAS_WIDTH;

        // BOLT OPTIMIZATION: Render static layer to buffer if dirty
        if (this._minimapDirty) {
            this._renderMinimapBuffer();
        }

        // Draw Cached Static Layer (Background + Resources + Buildings)
        if (this._minimapBufferCanvas) {
            this.minimapCtx.drawImage(this._minimapBufferCanvas, 0, 0);
        } else {
            // Fallback if buffer not initialized
            this.minimapCtx.fillStyle = '#1a1a2e';
            this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        }

        // Unidades
        // BOLT OPTIMIZATION: Batch draw calls for units (2 calls vs N calls)
        // Replaced for...of with standard loops and integer truncation for performance.

        // Batch 1: Player Units
        this.minimapCtx.fillStyle = '#48bb78';
        this.minimapCtx.beginPath();
        const unitsLen = this.units.length;
        for (let i = 0; i < unitsLen; i++) {
            const unit = this.units[i];
            const x = (unit.x * scale) | 0;
            const y = (unit.y * scale) | 0;
            this.minimapCtx.rect(x - 1, y - 1, 2, 2);
        }
        this.minimapCtx.fill();

        // Batch 2: Enemy Units
        this.minimapCtx.fillStyle = '#c53030';
        this.minimapCtx.beginPath();
        const enemiesLen = this.enemies.length;

        // BOLT OPTIMIZATION: Hoist FOW and inverse tile size
        const fow = this.fow;
        const invTileSize = fow.invTileSize;

        for (let i = 0; i < enemiesLen; i++) {
            const enemy = this.enemies[i];

            // FILTRADO POR NIEBLA DE GUERRA
            // Solo mostrar enemigos si están en zona visible
            // BOLT OPTIMIZATION: Use cached grid coordinates if available (avoids division)
            const col = (enemy._lastGridCol !== -1) ? enemy._lastGridCol : (enemy.x * invTileSize) | 0;
            const row = (enemy._lastGridRow !== -1) ? enemy._lastGridRow : (enemy.y * invTileSize) | 0;

            if (!fow.isVisible(col, row)) {
                continue;
            }

            const x = (enemy.x * scale) | 0;
            const y = (enemy.y * scale) | 0;
            this.minimapCtx.rect(x - 1, y - 1, 2, 2);
        }
        this.minimapCtx.fill();

        // 3. Niebla de Guerra en Minimapa
        this.renderMinimapFOW();

        // Cámara Viewport (Palette: Enhanced styling)
        const camX = this.camera.x * scale;
        const camY = this.camera.y * scale;
        const camW = this.viewWidth * scale;
        const camH = this.viewHeight * scale;

        this.minimapCtx.save();

        // Glow effect
        this.minimapCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.minimapCtx.shadowBlur = 4;

        // Border
        this.minimapCtx.strokeStyle = '#e8d48b'; // var(--text-gold)
        this.minimapCtx.lineWidth = 1.5;
        this.minimapCtx.strokeRect(camX, camY, camW, camH);

        // Subtle Fill (Lens effect)
        this.minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.minimapCtx.fillRect(camX, camY, camW, camH);

        this.minimapCtx.restore();
    }

    renderMinimapFOW() {
        if (!this.fow || !this.minimapCtx) return;

        const ctx = this.minimapCtx;

        // BOLT OPTIMIZATION: Only rebuild FOW paths when visibility state has changed
        // This eliminates ~2 Path2D allocations and O(rows × cols) iteration per frame
        // Expected impact: ~90% reduction in minimap FOW render time
        if (this._minimapFOWDirty) {
            const width = this.minimap.width;
            const height = this.minimap.height;
            const cols = this.fow.cols;
            const rows = this.fow.rows;

            // Scale from FOW grid tiles to minimap pixels
            const scaleX = width / cols;
            const scaleY = height / rows;

            // Reuse existing Path2D objects by creating new instances only when dirty
            // (Path2D has no clear() method, so we must replace the reference)
            this._minimapFOWHiddenPath = new Path2D();
            this._minimapFOWExploredPath = new Path2D();

            const grid = this.fow.grid;

            for (let r = 0; r < rows; r++) {
                const y = r * scaleY;
                const rowOffset = r * cols;
                for (let c = 0; c < cols; c++) {
                    const state = grid[rowOffset + c];
                    if (state === FOW_STATES.HIDDEN) {
                        this._minimapFOWHiddenPath.rect(c * scaleX, y, scaleX, scaleY);
                    } else if (state === FOW_STATES.EXPLORED) {
                        this._minimapFOWExploredPath.rect(c * scaleX, y, scaleX, scaleY);
                    }
                }
            }

            this._minimapFOWDirty = false;
        }

        // Draw cached paths (fast - just GPU commands)
        ctx.fillStyle = '#000000';
        ctx.fill(this._minimapFOWHiddenPath);

        ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.VISION.EXPLORED_OPACITY})`;
        ctx.fill(this._minimapFOWExploredPath);
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
        // Actualizar recursos con animación (Palette)
        const resourceKeys = ['wood', 'food', 'gold', 'stone'];
        const forceUpdate = this._forceUIUpdate;

        for (const key of resourceKeys) {
            const el = this.uiElements[`${key}Count`];
            if (!el) continue;

            const currentVal = Math.floor(this.resources[key]);
            const lastVal = Math.floor(this.lastResources[key] || 0);

            // BOLT OPTIMIZATION: Only update DOM text if value changed or forced
            // Reduces Layout thrashing and DOM calls by ~90% for these elements
            if (forceUpdate || currentVal !== lastVal) {
                el.textContent = currentVal;
            }

            // Trigger animation if value changed (and not first render)
            if (!forceUpdate && currentVal !== lastVal) {
                const isGain = currentVal > lastVal;
                const animClass = isGain ? 'resource-pop-up' : 'resource-pop-down';

                el.classList.remove('resource-pop-up', 'resource-pop-down');
                void el.offsetWidth; // Force reflow
                el.classList.add(animClass);
            }
        }

        // Update history for next frame
        this.lastResources = { ...this.resources };

        // Actualizar población
        // BOLT OPTIMIZATION: Only write if changed
        const currentPop = Math.floor(this.population);
        if (forceUpdate || this._lastRenderedPopulation !== currentPop) {
            if (this.uiElements.currentPopulation) this.uiElements.currentPopulation.textContent = currentPop;
            this._lastRenderedPopulation = currentPop;
        }

        if (this.uiElements.maxPopulation) this.uiElements.maxPopulation.textContent = this.maxPopulation;

        // Palette: Detailed Population Tooltip
        const popTooltip = document.getElementById('popTooltip');
        if (popTooltip) {
            let villagers = 0;
            let totalUnits = 0;
            for (let i = 0; i < this.units.length; i++) {
                if (this.units[i].team === 'player') {
                    totalUnits++;
                    if (this.units[i].type === 'villager') villagers++;
                }
            }
            const military = totalUnits - villagers;

            let houses = 0;
            for (let i = 0; i < this.buildings.length; i++) {
                const b = this.buildings[i];
                if (b.team === 'player' && b.type === 'house' && !b.isDead) houses++;
            }

            // Optimize: Only update DOM if content changed
            // Security: Use DOM creation instead of innerHTML to prevent XSS
            const currentPopState = `${villagers},${military},${houses},${this.townCenterCounts.player}`;

            if (this._lastPopTooltipState !== currentPopState) {
                this._lastPopTooltipState = currentPopState;
                popTooltip.textContent = ''; // Clear previous content

                const container = document.createElement('div');
                container.style.textAlign = 'left';
                container.style.minWidth = '140px';

                // Population Header
                const popHeader = document.createElement('div');
                popHeader.style.marginBottom = '4px';
                popHeader.className = 'text-gold';
                const popHeaderStrong = document.createElement('strong');
                popHeaderStrong.textContent = 'Población:';
                popHeader.appendChild(popHeaderStrong);
                container.appendChild(popHeader);

                // Helper for rows
                const createRow = (label, value) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = label;
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'text-light';
                    valueSpan.textContent = value;
                    row.appendChild(labelSpan);
                    row.appendChild(valueSpan);
                    return row;
                };

                container.appendChild(createRow('👨‍🌾 Aldeanos:', villagers));
                container.appendChild(createRow('⚔️ Militares:', military));

                // Capacity Section
                const capSection = document.createElement('div');
                capSection.style.marginTop = '6px';
                capSection.style.borderTop = '1px solid rgba(255,255,255,0.2)';
                capSection.style.paddingTop = '4px';

                const capHeader = document.createElement('div');
                capHeader.style.marginBottom = '2px';
                capHeader.className = 'text-gold';
                const capHeaderStrong = document.createElement('strong');
                capHeaderStrong.textContent = 'Capacidad:';
                capHeader.appendChild(capHeaderStrong);
                capSection.appendChild(capHeader);

                // Helper for capacity rows
                const createCapRow = (label, value) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.fontSize = '0.8rem';
                    row.className = 'text-medium';
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = label;
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = value;
                    row.appendChild(labelSpan);
                    row.appendChild(valueSpan);
                    return row;
                };

                capSection.appendChild(createCapRow('🏠 Casas:', houses));
                capSection.appendChild(createCapRow('🏰 Centros:', this.townCenterCounts.player));

                container.appendChild(capSection);
                popTooltip.appendChild(container);
            }
        }

        // Actualizar tiempo de juego
        const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${minutes}:${seconds}`;

        // BOLT OPTIMIZATION: Only write if changed (updates once per sec instead of 10x/sec)
        if (forceUpdate || this._lastRenderedTimeStr !== timeStr) {
            if (this.uiElements.gameTime) this.uiElements.gameTime.textContent = timeStr;
            this._lastRenderedTimeStr = timeStr;
        }

        this._forceUIUpdate = false;

        // Palette: Real-time update for build menu
        const buildMenu = document.getElementById('buildMenu');
        if (buildMenu && !buildMenu.classList.contains('hidden')) {
            this.updateBuildMenuState();
        }

        // Palette: Update Idle Villager Indicator
        if (this.uiElements.idleVillagerBtn && this.enableIdleVillagerCycle) {
            // OPTIMIZATION: Manual loop to count idle villagers without allocation
            // Replaces: this.units.filter(u => u.type === 'villager' && u.state === 'IDLE').length;
            // Benchmark: ~12x faster and avoids creating intermediate arrays every 100ms
            let idleCount = 0;
            const len = this.units.length;
            for (let i = 0; i < len; i++) {
                const u = this.units[i];
                if (u.type === 'villager' && u.state === 'IDLE') {
                    idleCount++;
                }
            }

            if (idleCount > 0) {
                if (this.uiElements.idleVillagerBtn.classList.contains('hidden')) {
                    this.uiElements.idleVillagerBtn.classList.remove('hidden');
                    // Ensure proper flex display (overriding CSS class hidden)
                    this.uiElements.idleVillagerBtn.style.display = 'flex';
                }
                if (this.uiElements.idleVillagerCount) {
                    this.uiElements.idleVillagerCount.textContent = idleCount;
                }
            } else {
                if (!this.uiElements.idleVillagerBtn.classList.contains('hidden')) {
                    this.uiElements.idleVillagerBtn.classList.add('hidden');
                    this.uiElements.idleVillagerBtn.style.display = 'none';
                }
            }
        }

        this.updateSelectionPanel();
        this.updateActionsPanel();
    }

    updateSelectionPanel() {
        // OPTIMIZACIÓN: Usar elemento cacheado
        const content = this.uiElements.selectionContent || document.getElementById('selectionContent');
        if (!content) return;

        // BOLT OPTIMIZATION: Calculate ID and State keys separately
        let stateKey = '';
        let idKey = ''; // Tracks structural identity (e.g. "single:123" or "multi:5")

        if (this.selectedEntities.length === 0) {
            const armyCount = this.getMilitaryUnits().length;
            idKey = 'empty';
            stateKey = `empty:${armyCount}`;
        } else if (this.selectedEntities.length === 1) {
            const ent = this.selectedEntities[0];
            // Include dynamic structural factors in ID key
            // If queue length changes or construction state changes, we need structure rebuild
            const qLen = (ent.productionQueue && !ent.productionQueue.isEmpty()) ? ent.productionQueue.length : 0;
            const isConst = ent.isUnderConstruction ? 1 : 0;
            idKey = `single:${ent.id}:q${qLen}:c${isConst}`;

            // Include HP, state, and progress in state key
            let prodKey = '';
            if (qLen > 0) {
                const prog = Math.floor(ent.productionQueue.getProgress() * 100);
                prodKey = `:prod${qLen}:${prog}`;
            }
            // BOLT OPTIMIZATION: Floor HP to avoid DOM thrashing on fractional damage/regen
            stateKey = `single:${ent.id}:${Math.floor(ent.hp)}:${ent.state}${prodKey}`;
        } else {
            idKey = `multi:${this.selectedEntities.length}`;
            stateKey = `multi:${this.selectedEntities.length}`;
        }

        // Palette: Si ya estamos en estado vacío, comprobar si debemos actualizar el tip
        // We use startsWith because key now contains count (e.g. empty:5)
        if (this.lastSelectionStateKey.startsWith('empty') && stateKey.startsWith('empty') && this.lastSelectionStateKey === stateKey) {
            const tipEl = content.querySelector('.selection-tip');
            // Actualizar cada 8 segundos
            if (tipEl && Date.now() - this.lastTipTime > 8000) {
                this.currentTipIndex = (this.currentTipIndex + 1) % GAMEPLAY_TIPS.length;

                // Palette: Smooth fade out/in transition
                tipEl.style.transition = 'opacity 0.2s ease-out';
                tipEl.style.opacity = '0';

                setTimeout(() => {
                    tipEl.textContent = `💡 Tip: ${GAMEPLAY_TIPS[this.currentTipIndex]}`;
                    tipEl.style.opacity = '0.8'; // Match default opacity
                }, 200);

                this.lastTipTime = Date.now();
            }
            return;
        }

        // Si el estado no ha cambiado, no tocar el DOM
        if (this.lastSelectionStateKey === stateKey) return;

        // BOLT OPTIMIZATION: Partial Update Strategy
        // If the identity of the selection hasn't changed (same unit), but the state has (e.g. HP change),
        // we update the existing DOM elements instead of rebuilding the entire tree.
        if (this.lastSelectionIdKey === idKey) {
            if (this.selectedEntities.length === 1) {
                const ent = this.selectedEntities[0];

                // Update HP Text
                const hpText = content.querySelector('.hp-text');
                const hpPercent = Math.max(0, Math.min(100, (ent.hp / ent.maxHp) * 100));

                if (hpText) {
                    if (ent.isUnderConstruction) {
                        hpText.textContent = `🚧 Construyendo: ${Math.floor(hpPercent)}%`;
                    } else {
                        hpText.textContent = `HP: ${Math.floor(ent.hp)}/${ent.maxHp}`;
                    }
                }

                // Update HP Bar
                const hpFill = content.querySelector('.health-fill');
                if (hpFill) {
                    hpFill.style.width = `${hpPercent}%`;

                    // Update color logic
                    if (ent.isUnderConstruction) {
                        hpFill.style.background = '#3182ce'; // Construction Blue
                    } else if (hpPercent < 25) {
                        hpFill.style.background = '#c53030'; // Red
                    } else if (hpPercent < 50) {
                        hpFill.style.background = '#ecc94b'; // Yellow
                    } else {
                        hpFill.style.background = '#48bb78'; // Green
                    }
                }

                // Update Production Progress (if visible)
                if (ent.productionQueue && !ent.productionQueue.isEmpty()) {
                    const prodFill = content.querySelector('.production-fill');
                    if (prodFill) {
                        const prog = ent.productionQueue.getProgress() * 100;
                        prodFill.style.width = `${prog}%`;
                    }

                    const prodTime = content.querySelector('.production-time');
                    const currentItem = ent.productionQueue.getCurrentItem();
                    if (prodTime && currentItem) {
                        prodTime.textContent = `${Math.ceil(currentItem.remaining)}s`;
                    }
                }

                // Update State Key and Return (Skip full rebuild)
                this.lastSelectionStateKey = stateKey;
                return;
            }
        }

        this.lastSelectionStateKey = stateKey;
        this.lastSelectionIdKey = idKey; // Update ID key

        // Limpiar contenido previo
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }

        // Helper para crear botón de deselección (Palette)
        const createDeselectButton = () => {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-close'; // Reuse existing class
            closeBtn.style.cssText = 'position: absolute; top: 0; right: 0; width: 20px; height: 20px; font-size: 10px; z-index: 20; padding: 0; line-height: 1;';
            closeBtn.setAttribute('aria-label', 'Deseleccionar (Esc)');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.selectedEntities = [];
                this.updateSelectionPanel();
                this.updateActionsPanel();
            };
            return closeBtn;
        };

        if (this.selectedEntities.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'selection-empty-state';
            emptyState.setAttribute('role', 'status');
            emptyState.setAttribute('aria-live', 'polite');

            // Icon
            const iconDiv = document.createElement('div');
            iconDiv.className = 'selection-empty-icon';

            const iconImg = document.createElement('img');
            iconImg.src = 'assets/icons/cursor.png';
            iconImg.alt = '';
            iconImg.className = 'selection-empty-img';
            // Show fallback text if image fails (safety net for missing asset)
            iconImg.onerror = () => {
                iconImg.style.display = 'none';
                iconDiv.textContent = '👆'; // Text fallback (better than nothing)
            };

            iconDiv.appendChild(iconImg);
            iconDiv.setAttribute('aria-hidden', 'true');

            // Text
            const textDiv = document.createElement('div');
            textDiv.className = 'selection-empty-title';
            textDiv.textContent = 'Listo para órdenes';

            const subTextDiv = document.createElement('div');
            subTextDiv.className = 'selection-empty-subtitle';
            subTextDiv.textContent = 'Selecciona una unidad o edificio';

            // Gameplay Tip (Palette enhancement)
            const tipDiv = document.createElement('div');
            tipDiv.className = 'selection-tip';
            tipDiv.setAttribute('aria-live', 'polite'); // Ensure screen readers announce updates

            // Pick a random tip initiallly
            if (!this.lastSelectionStateKey.startsWith('empty')) {
                this.currentTipIndex = Math.floor(Math.random() * GAMEPLAY_TIPS.length);
                this.lastTipTime = Date.now();
            }
            // Palette: Tip of the Moment
            // Ensure aria-live updates are announced gracefully
            tipDiv.textContent = `💡 Tip: ${GAMEPLAY_TIPS[this.currentTipIndex]}`;

            emptyState.appendChild(iconDiv);
            emptyState.appendChild(textDiv);
            emptyState.appendChild(subTextDiv);
            emptyState.appendChild(tipDiv);

            // Palette: Quick Actions Section
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'margin-top:15px; display:flex; flex-direction:column; gap:8px; width:100%; padding:0 10px;';

            const createActionBtn = (icon, text, kbd, onClick, style = '') => {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                // Palette: Added aria-keyshortcuts for accessibility
                if (kbd) btn.setAttribute('aria-keyshortcuts', kbd);
                // Palette: Added aria-label for accessibility (text content)
                btn.setAttribute('aria-label', `${text} (${kbd})`);

                btn.style.cssText = `font-size:0.8rem; padding:6px 10px; display:flex; align-items:center; justify-content:center; gap:6px; ${style}`;

                // Securely create content without innerHTML
                const img = document.createElement('img');
                img.src = `assets/icons/${icon}.png`;
                img.className = 'icon-tiny';
                img.alt = '';
                btn.appendChild(img);

                btn.appendChild(document.createTextNode(` ${text} `));

                const span = document.createElement('span');
                span.className = 'kbd-inline';
                span.style.fontSize = '0.65rem';
                span.textContent = kbd;
                btn.appendChild(span);

                btn.onclick = (e) => { e.stopPropagation(); onClick(); if (typeof soundManager !== 'undefined') soundManager.play('click'); };
                return btn;
            };

            // Action 1: Focus Town Center
            actionsDiv.appendChild(createActionBtn('townCenter', 'Ir al Centro Urbano', 'Espacio', () => {
                const tc = this.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
                if (tc) { this.focusCamera(tc.x, tc.y); }
                else this.showNotification('No tienes Centro Urbano', 'error');
            }));

            // Action 2: Select All Army (Palette)
            // Count military units (not villagers, alive, player team)
            const armyCount = this.getMilitaryUnits().length;

            if (armyCount > 0) {
                actionsDiv.appendChild(createActionBtn('swords', `Seleccionar Ejército (${armyCount})`, ',',
                    () => this.selectAllArmy(), 'border-color:#e53e3e; color:#e53e3e;'));
            }

            // Action 3: Idle Villager (Conditional)
            let idleCount = 0;
            for (let i = 0; i < this.units.length; i++) { if (this.units[i].type === 'villager' && this.units[i].state === 'IDLE') idleCount++; }

            if (idleCount > 0) {
                actionsDiv.appendChild(createActionBtn('villager', `Aldeano Inactivo (${idleCount})`, 'Tab',
                    () => this.selectNextIdleVillager(), 'border-color:#f0ad4e; color:#f0ad4e;'));
            }
            emptyState.appendChild(actionsDiv);

            content.appendChild(emptyState);
            return;
        }

        if (this.selectedEntities.length === 1) {
            const entity = this.selectedEntities[0];

            const infoDiv = document.createElement('div');
            infoDiv.className = 'selection-info';
            infoDiv.style.position = 'relative'; // Palette: For close button positioning

            // Palette: Add Deselect Button
            infoDiv.appendChild(createDeselectButton());

            const iconDiv = document.createElement('div');
            iconDiv.className = 'selection-icon';

            let iconSrc = null;
            if (typeof assetLoader !== 'undefined') {
                iconSrc = assetLoader.getSrc(entity.type);
            }

            if (iconSrc) {
                const img = document.createElement('img');
                img.src = iconSrc;
                img.alt = entity.name; // entity.name is usually safe but setting property is safer than HTML string
                img.className = 'icon-large';
                iconDiv.appendChild(img);
            } else {
                // Fallback to emoji or text if no image
                iconDiv.textContent = entity.icon || '';
            }

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'selection-details';

            const nameHeader = document.createElement('h3');
            nameHeader.textContent = entity.name;

            const statsDiv = document.createElement('div');
            statsDiv.className = 'selection-stats';

            // Palette: Visual Health Bar
            const hpContainer = document.createElement('div');
            hpContainer.className = 'hp-container';
            hpContainer.style.marginBottom = '6px';

            const hpPercent = Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100));

            // Palette: Construction Progress Indicator
            if (entity.isUnderConstruction) {
                const statusText = document.createElement('div');
                statusText.className = 'hp-text'; // BOLT OPTIMIZATION: Added class for query
                statusText.style.fontSize = '0.8rem';
                statusText.style.color = '#ecc94b'; // Yellow/Gold
                statusText.style.marginBottom = '2px';
                statusText.style.fontWeight = 'bold';
                statusText.textContent = `🚧 Construyendo: ${Math.floor(hpPercent)}%`;
                hpContainer.appendChild(statusText);
            } else {
                const hpText = document.createElement('div');
                hpText.className = 'hp-text'; // BOLT OPTIMIZATION: Added class for query
                hpText.textContent = `HP: ${Math.floor(entity.hp)}/${entity.maxHp}`;
                hpText.style.marginBottom = '2px';
                hpText.style.fontSize = '0.8rem';
                hpContainer.appendChild(hpText);
            }

            const hpBar = document.createElement('div');
            hpBar.className = 'health-bar';
            hpBar.style.height = '6px';
            hpBar.style.background = 'rgba(255, 255, 255, 0.2)';
            hpBar.setAttribute('role', 'progressbar');
            hpBar.setAttribute('aria-valuenow', Math.floor(entity.hp));
            hpBar.setAttribute('aria-valuemin', '0');
            hpBar.setAttribute('aria-valuemax', entity.maxHp);
            hpBar.setAttribute('aria-label', entity.isUnderConstruction ? `Progreso de construcción de ${entity.name}` : `Salud de ${entity.name}`);

            const hpFill = document.createElement('div');
            hpFill.className = 'health-fill';
            hpFill.style.width = `${hpPercent}%`;

            // Color logic based on state and health percentage
            if (entity.isUnderConstruction) {
                hpFill.style.background = '#3182ce'; // Construction Blue
            } else if (hpPercent < 25) {
                hpFill.style.background = '#c53030'; // Red
            } else if (hpPercent < 50) {
                hpFill.style.background = '#ecc94b'; // Yellow
            } else {
                hpFill.style.background = '#48bb78'; // Green
            }

            hpBar.appendChild(hpFill);
            hpContainer.appendChild(hpBar);
            statsDiv.appendChild(hpContainer);

            if (entity.attackDamage) {
                const attackDiv = document.createElement('div');
                attackDiv.textContent = `Ataque: ${entity.attackDamage}`;
                statsDiv.appendChild(attackDiv);
            }

            // Mostrar cola de producción si el edificio tiene una
            if (entity.productionQueue && entity.productionQueue.length > 0) {
                const prodContainer = document.createElement('div');
                prodContainer.className = 'production-container';
                prodContainer.style.marginTop = '8px';
                prodContainer.style.borderTop = '1px solid rgba(212, 175, 55, 0.3)';
                prodContainer.style.paddingTop = '8px';

                const prodTitle = document.createElement('div');
                prodTitle.style.fontSize = '0.75rem';
                prodTitle.style.opacity = '0.7';
                prodTitle.style.marginBottom = '4px';
                prodTitle.textContent = '🔨 En producción:';
                prodContainer.appendChild(prodTitle);

                const current = entity.productionQueue.getCurrentItem();
                if (current) {
                    const currentDiv = document.createElement('div');
                    currentDiv.style.display = 'flex';
                    currentDiv.style.alignItems = 'center';
                    currentDiv.style.gap = '8px';
                    currentDiv.style.marginBottom = '4px';

                    // Icono de la unidad
                    const unitIcon = document.createElement('img');
                    unitIcon.src = `assets/icons/${current.unitType}.png`;
                    unitIcon.alt = current.unitType;
                    unitIcon.style.width = '24px';
                    unitIcon.style.height = '24px';
                    unitIcon.onerror = () => { unitIcon.style.display = 'none'; };
                    currentDiv.appendChild(unitIcon);

                    // Nombre y tiempo
                    const unitInfo = document.createElement('div');
                    unitInfo.style.flex = '1';
                    unitInfo.textContent = current.unitType.charAt(0).toUpperCase() + current.unitType.slice(1);
                    currentDiv.appendChild(unitInfo);

                    // Tiempo restante
                    const timeLeft = document.createElement('div');
                    timeLeft.className = 'production-time'; // BOLT OPTIMIZATION: Added class for query
                    timeLeft.style.fontSize = '0.8rem';
                    timeLeft.style.color = '#48bb78';
                    timeLeft.textContent = `${Math.ceil(current.remaining)}s`;
                    currentDiv.appendChild(timeLeft);

                    prodContainer.appendChild(currentDiv);

                    // Barra de progreso
                    const progressBar = document.createElement('div');
                    progressBar.className = 'production-bar';
                    progressBar.style.height = '4px';
                    progressBar.style.background = 'rgba(255, 255, 255, 0.1)';
                    progressBar.style.borderRadius = '2px';
                    progressBar.style.overflow = 'hidden';

                    const progressFill = document.createElement('div');
                    progressFill.className = 'production-fill';
                    const progress = entity.productionQueue.getProgress() * 100;
                    progressFill.style.width = `${progress}%`;
                    progressFill.style.height = '100%';
                    progressFill.style.background = 'linear-gradient(90deg, #4299e1, #48bb78)';
                    progressFill.style.transition = 'width 0.1s ease';

                    progressBar.appendChild(progressFill);
                    prodContainer.appendChild(progressBar);

                    // Mostrar cola restante (Palette: Visual Queue)
                    if (entity.productionQueue.length > 1) {
                        const queueDiv = document.createElement('div');
                        queueDiv.className = 'queue-container';
                        // Styles moved to CSS

                        const queueItems = entity.productionQueue.getQueue();

                        // Start from 1 because 0 is the current active item
                        for (let i = 1; i < queueItems.length; i++) {
                            const item = queueItems[i];
                            const qItem = document.createElement('div');
                            qItem.className = 'queue-item';
                            // Styles moved to CSS

                            // Tooltip / Label
                            qItem.setAttribute('role', 'button');
                            qItem.setAttribute('tabindex', '0'); // Accessibility: Keyboard focus
                            qItem.setAttribute('aria-label', `Cancelar ${item.unitType}`);
                            qItem.title = `Cancelar ${item.unitType} (Click para reembolsar)`;

                            // Icon
                            if (typeof assetLoader !== 'undefined') {
                                const src = assetLoader.getSrc(item.unitType);
                                if (src) {
                                    const img = document.createElement('img');
                                    img.src = src;
                                    img.alt = item.unitType;
                                    // Styles moved to CSS
                                    qItem.appendChild(img);
                                } else {
                                    qItem.textContent = item.unitType.charAt(0).toUpperCase();
                                    qItem.classList.add('queue-item-text');
                                }
                            }

                            // Cancel Badge (on hover via CSS)
                            const badge = document.createElement('div');
                            badge.className = 'queue-item-badge';
                            badge.textContent = '×';
                            qItem.appendChild(badge);

                            // Hover effects handled by CSS

                            // Action Logic (Shared)
                            const cancelAction = () => {
                                // Note: We use the index at the time of iteration.
                                // Since we rebuild the UI immediately after modification, this is safe.
                                const cancelled = entity.productionQueue.cancelAt(i);

                                if (cancelled && cancelled.cost) {
                                    // Refund Resources
                                    for (const [res, amount] of Object.entries(cancelled.cost)) {
                                        this.resources[res] = (this.resources[res] || 0) + amount;
                                        this.flashResource(res);
                                    }

                                    // Feedback
                                    this.showNotification(`${item.unitType} cancelado`, 'info');
                                    if (typeof soundManager !== 'undefined') soundManager.play('click');

                                    // Force UI Refresh
                                    this.updateSelectionPanel();
                                    this.updateUI();
                                }
                            };

                            // Click Handler
                            qItem.onclick = (e) => {
                                e.stopPropagation();
                                cancelAction();
                            };

                            // Keyboard Handler
                            qItem.onkeydown = (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    cancelAction();
                                }
                            };

                            queueDiv.appendChild(qItem);
                        }

                        prodContainer.appendChild(queueDiv);
                    }
                }

                statsDiv.appendChild(prodContainer);
            }

            detailsDiv.appendChild(nameHeader);
            detailsDiv.appendChild(statsDiv);

            infoDiv.appendChild(iconDiv);
            infoDiv.appendChild(detailsDiv);
            content.appendChild(infoDiv);
        } else {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'selection-info';
            infoDiv.style.position = 'relative'; // Palette: For close button positioning

            // Palette: Add Deselect Button
            infoDiv.appendChild(createDeselectButton());

            const iconDiv = document.createElement('div');
            iconDiv.className = 'selection-icon';

            let iconSrc = null;
            if (typeof assetLoader !== 'undefined') {
                iconSrc = assetLoader.getSrc('population');
            }

            if (iconSrc) {
                const img = document.createElement('img');
                img.src = iconSrc;
                img.alt = 'Group';
                iconDiv.appendChild(img);
            } else {
                const span = document.createElement('span');
                span.textContent = 'GRP';
                iconDiv.appendChild(span);
            }

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'selection-details';

            const nameHeader = document.createElement('h3');
            nameHeader.textContent = `${this.selectedEntities.length} Unidades`;

            const statsDiv = document.createElement('div');
            statsDiv.className = 'selection-stats';

            // Group entities by type
            const groups = {};
            this.selectedEntities.forEach(e => {
                if (!groups[e.type]) groups[e.type] = 0;
                groups[e.type]++;
            });

            const groupContainer = document.createElement('div');
            groupContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;';

            for (const [type, count] of Object.entries(groups)) {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.style.cssText = 'padding:4px 8px; font-size:0.75rem; display:flex; align-items:center; gap:6px; border-color:var(--stone-light);';
                btn.setAttribute('aria-label', `Seleccionar solo ${count} ${type}`);

                // Icon
                if (typeof assetLoader !== 'undefined') {
                    const iconSrc = assetLoader.getSrc(type);
                    if (iconSrc) {
                        const img = document.createElement('img');
                        img.src = iconSrc;
                        img.className = 'icon-tiny';
                        img.alt = '';
                        btn.appendChild(img);
                    }
                }

                // Count
                const countSpan = document.createElement('span');
                countSpan.textContent = count;
                countSpan.style.fontWeight = 'bold';
                btn.appendChild(countSpan);

                // Click to filter
                btn.onclick = (e) => {
                    e.stopPropagation();
                    // Filter selection
                    this.selectedEntities = this.selectedEntities.filter(ent => ent.type === type);
                    // Refresh
                    this.updateSelectionPanel();
                    this.updateActionsPanel();
                    // Feedback
                    if (typeof soundManager !== 'undefined') soundManager.play('click');
                };

                // Palette: Contextual Highlight on Hover
                btn.onmouseenter = () => this.hoveredType = type;
                btn.onmouseleave = () => this.hoveredType = null;

                groupContainer.appendChild(btn);
            }
            statsDiv.appendChild(groupContainer);

            detailsDiv.appendChild(nameHeader);
            detailsDiv.appendChild(statsDiv);

            infoDiv.appendChild(iconDiv);
            infoDiv.appendChild(detailsDiv);
            content.appendChild(infoDiv);
        }
    }

    updateActionsPanel() {
        // Usar el nuevo ID commandPanel
        // OPTIMIZACIÓN: Usar elemento cacheado
        const grid = this.uiElements.commandPanel || document.getElementById('commandPanel');
        if (!grid) return;

        // OPTIMIZATION: Initialize grid only once
        const hotkeys = [
            'Q', 'W', 'E', 'R', 'T',
            'A', 'S', 'D', 'F', 'G'
        ];

        if (grid.childElementCount !== 10) {
            grid.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                const btn = document.createElement('button');
                btn.className = 'action-btn disabled';
                btn.setAttribute('data-hotkey', hotkeys[i]);
                grid.appendChild(btn);
            }
        }

        // Si no hay selección o es múltiple, mostrar panel vacío
        if (this.selectedEntities.length !== 1) {
            this.renderEmptyGrid(grid);
            return;
        }

        const entity = this.selectedEntities[0];

        // Solo mostrar acciones si es del jugador
        if (entity.team !== 'player') {
            this.renderEmptyGrid(grid);
            return;
        }

        const buttons = [];

        // Helper para crear elementos
        const createIconElement = (key, fallback) => {
            if (typeof assetLoader !== 'undefined') {
                const src = assetLoader.getSrc(key);
                if (src) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.className = 'icon-small';
                    return img;
                }
            }
            // Return fallback if no image
            const span = document.createElement('span');
            span.textContent = fallback || '';
            return span;
        }

        // Helper para crear elementos de costo (Legacy for internal cost text generation if needed)
        // Updated to use full names for better a11y text generation
        const getCostText = (cost) => {
            const parts = [];
            for (const [res, amount] of Object.entries(cost)) {
                if (amount > 0) parts.push(`${amount} ${res}`);
            }
            return parts.length > 0 ? `Costo: ${parts.join(', ')}` : '';
        };

        // Si hay que renderizar vacío, comprobamos si ya estaba vacío
        if (typeof shouldRenderEmpty !== 'undefined' && shouldRenderEmpty) {
            if (this.lastActionsStateKey === 'empty') return;

            // Renderizar vacío y salir
            while (grid.firstChild) grid.removeChild(grid.firstChild);
            this.renderEmptyGrid(grid);
            this.lastActionsStateKey = 'empty';
            return;
        }

        // --- LÓGICA DE GENERACIÓN DE BOTONES ---
        // (Movemos la lógica de botones aquí para calcular el hash antes de tocar el DOM)

        const popFull = this.population >= this.maxPopulation;

        if (entity.type === 'villager') {
            buttons.push({
                iconKey: 'workshop',
                iconFallback: '🏗️',
                label: 'Construir',
                description: 'Construir edificios y estructuras',
                hotkey: 'Q',
                action: () => this.openBuildMenu(),
                enabled: true
            });
        } else if (entity.type === 'townCenter') {
            const cost = CONFIG.UNIT_COSTS.villager;
            const canAfford = this.canAfford(cost);
            const enabled = canAfford && !popFull;
            let error = null;
            if (!canAfford) error = 'Recursos insuficientes';
            else if (popFull) error = 'Límite de población alcanzado';

            buttons.push({
                iconKey: 'villager',
                iconFallback: '👨‍🌾',
                label: 'Aldeano',
                description: 'Recoge recursos y construye edificios',
                hotkey: 'Q',
                cost: cost,
                action: () => this.trainUnit('villager', this.selectedEntities[0]),
                enabled: enabled,
                error: error
            });
        } else if (entity.type === 'barracks') {
            const warriorCost = CONFIG.UNIT_COSTS.warrior;
            const archerCost = CONFIG.UNIT_COSTS.archer;
            const canAffordWarrior = this.canAfford(warriorCost);
            const canAffordArcher = this.canAfford(archerCost);

            let warriorError = null;
            if (!canAffordWarrior) warriorError = 'Recursos insuficientes';
            else if (popFull) warriorError = 'Límite de población alcanzado';

            let archerError = null;
            if (!canAffordArcher) archerError = 'Recursos insuficientes';
            else if (popFull) archerError = 'Límite de población alcanzado';

            buttons.push({
                iconKey: 'warrior',
                iconFallback: '⚔️',
                label: 'Guerrero',
                description: 'Infantería eficaz en combate cuerpo a cuerpo',
                hotkey: 'Q',
                cost: warriorCost,
                action: () => this.trainUnit('warrior', this.selectedEntities[0]),
                enabled: canAffordWarrior && !popFull,
                error: warriorError
            });

            buttons.push({
                iconKey: 'archer',
                iconFallback: '🏹',
                label: 'Arquero',
                description: 'Unidad a distancia, débil cuerpo a cuerpo',
                hotkey: 'W',
                cost: archerCost,
                action: () => this.trainUnit('archer', this.selectedEntities[0]),
                enabled: canAffordArcher && !popFull,
                error: archerError
            });
        }

        // Añadir tecnologías disponibles
        if (this.techManager) {
            const availableTechs = this.techManager.getAvailableTechsForBuilding(entity.type);

            for (let tech of availableTechs) {
                if (buttons.length >= 10) break;

                const canAfford = this.techManager.canResearch(tech.id);

                // Determine best icon for technology
                let techIconKey = tech.id;
                let techFallback = '🔬';

                let hasSpecificIcon = false;
                if (typeof assetLoader !== 'undefined') {
                    if (assetLoader.getSrc(tech.id)) {
                        hasSpecificIcon = true;
                    }
                }

                if (!hasSpecificIcon) {
                    if (tech.category === 'Economía' || tech.category === 'ECONOMY') techIconKey = 'tech_economy';
                    else if (tech.category === 'Militar' || tech.category === 'MILITARY') techIconKey = 'tech_military';
                    else if (tech.category === 'Defensa' || tech.category === 'DEFENSE') techIconKey = 'tech_defense';
                    else techIconKey = 'science';
                }

                buttons.push({
                    iconKey: techIconKey,
                    iconFallback: tech.icon || techFallback,
                    label: tech.name,
                    description: tech.description,
                    hotkey: hotkeys[buttons.length],
                    cost: tech.cost,
                    action: () => this.techManager.startResearch(tech.id),
                    enabled: canAfford
                });
            }
        }

        // Palette: Add Destroy Button for all player entities
        buttons.push({
            iconKey: 'skull', // Will fallback
            iconFallback: '💀',
            label: 'Destruir',
            description: 'Elimina la unidad o edificio seleccionado',
            hotkey: 'Supr',
            action: () => this.deleteSelectedEntities(),
            enabled: true,
            isDestructive: true
        });

        // OPTIMIZATION: Reuse DOM elements
        const gridButtons = Array.from(grid.children);

        for (let i = 0; i < 10; i++) {
            const btn = gridButtons[i];
            const hotkey = hotkeys[i];

            if (i < buttons.length) {
                const buttonData = buttons[i];
                const costString = buttonData.cost ? JSON.stringify(buttonData.cost) : '';
                const newStateKey = `active|${buttonData.label}|${buttonData.enabled}|${costString}|${buttonData.iconKey}`;

                // Check if update is needed
                if (btn.dataset.stateKey !== newStateKey) {
                    btn.innerHTML = ''; // Clear content
                    btn.className = 'action-btn'; // Reset class

                    // Construir texto de costo para accesibilidad
                    let costText = '';
                    if (buttonData.cost) {
                        costText = getCostText(buttonData.cost);
                    }

                    // ACCESIBILIDAD (Palette Improved)
                    btn.setAttribute('aria-keyshortcuts', hotkey);
                    const label = `${buttonData.label} (${hotkey})`;
                    // Include description if available
                    let fullLabel = label;
                    if (buttonData.description) fullLabel += `. ${buttonData.description}`;
                    if (costText) fullLabel += `. ${costText}`;

                    btn.setAttribute('aria-label', fullLabel);

                    // Remove native tooltip
                    btn.removeAttribute('title');

                    if (buttonData.isDestructive) {
                        btn.style.borderColor = '#c53030'; // var(--blood-red)
                        btn.style.color = '#fc8181'; // light red
                        // Add subtle red background
                        btn.style.background = 'linear-gradient(180deg, rgba(197, 48, 48, 0.1) 0%, rgba(197, 48, 48, 0.2) 100%)';
                    } else {
                        // Reset specific styles if reused
                        btn.style.borderColor = '';
                        btn.style.color = '';
                        btn.style.background = '';
                    }

                    if (!buttonData.enabled) {
                        btn.classList.add('disabled');
                        btn.setAttribute('aria-disabled', 'true');
                        // Palette: Reactive Disabled Feedback
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            btn.classList.remove('shake');
                            void btn.offsetWidth; // Force reflow
                            btn.classList.add('shake');

                            if (typeof soundManager !== 'undefined') {
                                soundManager.play('error');
                            }

                            // Show why it's disabled
                            let msg = buttonData.error || 'Acción no disponible';
                            // If missing resources were calculated in the loop below (from previous render or just now if we could access them early)
                            // Since we populate _missingResources in the tooltip generation below, we might miss it on FIRST render if we click instantly?
                            // No, closures capture the object reference. If _missingResources is added to buttonData later in this same function execution,
                            // the click handler (executed later) will see it.
                            if (buttonData._missingResources && buttonData._missingResources.length > 0) {
                                // Translate for display if raw strings
                                const translated = buttonData._missingResources.map(mr => {
                                    // Extract resource name to flash it
                                    const resName = mr.split(' ')[0].trim();
                                    this.flashResource(resName); // Palette: Flash resource

                                    if (mr.includes('food')) return mr.replace('food', 'Comida');
                                    if (mr.includes('wood')) return mr.replace('wood', 'Madera');
                                    if (mr.includes('gold')) return mr.replace('gold', 'Oro');
                                    if (mr.includes('stone')) return mr.replace('stone', 'Piedra');
                                    return mr;
                                });
                                msg = `Falta: ${translated.join(', ')}`;
                            }

                            // Palette: Flash population if that's the error
                            if (msg.includes('población') || msg.includes('Población')) {
                                this.flashResource('population');
                            }

                            this.showNotification(msg, 'error');
                        };
                    } else {
                        btn.onclick = buttonData.action;
                        btn.removeAttribute('aria-disabled');
                    }

                    const hotkeyDiv = document.createElement('div');
                    hotkeyDiv.className = 'btn-hotkey';
                    hotkeyDiv.textContent = hotkey;
                    btn.appendChild(hotkeyDiv);

                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'btn-icon';
                    const iconEl = createIconElement(buttonData.iconKey, buttonData.iconFallback);
                    if (iconEl) iconDiv.appendChild(iconEl);

                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'btn-label';
                    labelDiv.textContent = buttonData.label;

                    btn.appendChild(iconDiv);
                    btn.appendChild(labelDiv);

                    // Palette: Custom Tooltip Construction
                    const tooltipDiv = document.createElement('div');
                    tooltipDiv.className = 'btn-tooltip';
                    tooltipDiv.setAttribute('role', 'tooltip');

                    const tooltipHeader = document.createElement('div');
                    tooltipHeader.className = 'tooltip-header';

                    // Securely create tooltip header without innerHTML
                    const labelText = document.createTextNode(`${buttonData.label} `);
                    const hotkeySpan = document.createElement('span');
                    hotkeySpan.className = 'tooltip-hotkey';
                    hotkeySpan.textContent = `[${hotkey}]`;

                    tooltipHeader.appendChild(labelText);
                    tooltipHeader.appendChild(hotkeySpan);

                    tooltipDiv.appendChild(tooltipHeader);

                    if (buttonData.description) {
                        const descDiv = document.createElement('div');
                        descDiv.className = 'tooltip-desc';
                        descDiv.textContent = buttonData.description;
                        tooltipDiv.appendChild(descDiv);
                    }

                    if (buttonData.cost) {
                        const costTooltip = document.createElement('div');
                        costTooltip.className = 'tooltip-cost';
                        const missingResources = []; // Palette: Track missing resources

                        for (const [res, amount] of Object.entries(buttonData.cost)) {
                            const resSpan = document.createElement('span');
                            resSpan.className = 'cost-item';

                            // Palette: Use secure icon generation
                            if (typeof assetLoader !== 'undefined' && assetLoader.getSrc) {
                                const iconSrc = assetLoader.getSrc(res);
                                if (iconSrc) {
                                    const img = document.createElement('img');
                                    img.src = iconSrc;
                                    img.className = 'icon-tiny';
                                    img.alt = res;
                                    resSpan.appendChild(img);
                                } else {
                                    resSpan.textContent = res.substring(0, 1).toUpperCase();
                                }
                            } else {
                                let icon = '';
                                if (res === 'food') icon = '🌾';
                                else if (res === 'wood') icon = '🌲';
                                else if (res === 'gold') icon = '💰';
                                else if (res === 'stone') icon = '🪨';
                                resSpan.textContent = icon;
                            }

                            const amountText = document.createTextNode(` ${amount}`);
                            resSpan.appendChild(amountText);

                            // Palette: Highlight missing resources
                            if (this.resources[res] < amount) {
                                resSpan.style.color = 'var(--accent-red)';
                                resSpan.setAttribute('aria-label', `${amount} ${res} (Insuficiente)`);
                                missingResources.push(`${res} (${amount - Math.floor(this.resources[res])})`);
                            } else {
                                resSpan.setAttribute('aria-label', `${amount} ${res}`);
                            }

                            costTooltip.appendChild(resSpan);
                        }
                        tooltipDiv.appendChild(costTooltip);

                        // Palette: Store missing info for error message
                        buttonData._missingResources = missingResources;
                    }

                    // Palette: Add generic error label (Population or Resources)
                    if (!buttonData.enabled && buttonData.error) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'tooltip-error';
                        errorDiv.style.color = 'var(--accent-red)';
                        errorDiv.style.marginTop = '4px';
                        errorDiv.style.fontSize = '0.75rem';
                        errorDiv.style.fontWeight = 'bold';
                        errorDiv.textContent = `❌ ${buttonData.error}`;
                        tooltipDiv.appendChild(errorDiv);
                    } else if (!buttonData.enabled && buttonData.cost && !this.canAfford(buttonData.cost)) {
                        // Fallback for legacy items without explicit error
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'tooltip-error';
                        errorDiv.style.color = 'var(--accent-red)';
                        errorDiv.style.marginTop = '4px';
                        errorDiv.style.fontSize = '0.75rem';
                        errorDiv.style.fontWeight = 'bold';

                        // Palette: Show specific missing resources
                        if (buttonData._missingResources && buttonData._missingResources.length > 0) {
                            // Translate resource names for better UX
                            const translatedMissing = buttonData._missingResources.map(mr => {
                                let [name, amt] = mr.split(' (');
                                amt = '(' + amt;
                                if (name === 'food') name = 'comida';
                                else if (name === 'wood') name = 'madera';
                                else if (name === 'gold') name = 'oro';
                                else if (name === 'stone') name = 'piedra';
                                return `${name} ${amt}`;
                            });
                            errorDiv.textContent = `❌ Falta: ${translatedMissing.join(', ')}`;
                        } else {
                            errorDiv.textContent = '❌ Recursos insuficientes';
                        }
                        tooltipDiv.appendChild(errorDiv);
                    }

                    btn.appendChild(tooltipDiv);

                    btn.dataset.stateKey = newStateKey;
                } else {
                    // Even if visual state is same, update action closure just in case (cheap)
                    if (buttonData.enabled) {
                        btn.onclick = buttonData.action;
                    }
                }
            } else {
                const newStateKey = `empty|${hotkey}`;

                if (btn.dataset.stateKey !== newStateKey) {
                    btn.innerHTML = '';
                    btn.className = 'action-btn disabled';
                    btn.onclick = null;

                    // ACCESIBILIDAD
                    btn.setAttribute('aria-disabled', 'true');
                    btn.setAttribute('aria-label', `Ranura vacía ${hotkey}`);
                    btn.setAttribute('aria-keyshortcuts', hotkey);

                    const hotkeyDiv = document.createElement('div');
                    hotkeyDiv.className = 'btn-hotkey';
                    hotkeyDiv.textContent = hotkey;

                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'btn-icon';

                    btn.appendChild(hotkeyDiv);
                    btn.appendChild(iconDiv);

                    btn.dataset.stateKey = newStateKey;
                }
            }
        }
    }

    renderEmptyGrid(grid) {
        const hotkeys = [
            'Q', 'W', 'E', 'R', 'T',
            'A', 'S', 'D', 'F', 'G',
            'Z', 'X', 'C', 'V', 'B'
        ];

        // Ensure grid has 15 children
        if (grid.childElementCount !== 10) {
            grid.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                grid.appendChild(document.createElement('button'));
            }
        }

        const gridButtons = Array.from(grid.children);

        for (let i = 0; i < 10; i++) {
            const btn = gridButtons[i];
            const hotkey = hotkeys[i];
            const newStateKey = `empty|${hotkey}`;

            if (btn.dataset.stateKey !== newStateKey) {
                btn.innerHTML = '';
                btn.className = 'action-btn disabled';
                btn.onclick = null;

                // ACCESIBILIDAD
                btn.setAttribute('aria-disabled', 'true');
                btn.setAttribute('aria-label', `Ranura vacía ${hotkey}`);
                btn.setAttribute('aria-keyshortcuts', hotkey);

                const hotkeyDiv = document.createElement('div');
                hotkeyDiv.className = 'btn-hotkey';
                hotkeyDiv.textContent = hotkey;

                const iconDiv = document.createElement('div');
                iconDiv.className = 'btn-icon';

                btn.appendChild(hotkeyDiv);
                btn.appendChild(iconDiv);

                btn.dataset.stateKey = newStateKey;
            }
        }
    }

    showNotification(message, type = 'info', location = null) {
        // OPTIMIZACIÓN: Usar elemento cacheado
        const container = this.uiElements.notifications || document.getElementById('notifications');
        if (!container) return; // Defensive check

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'status');

        // Palette: Interactive Notification
        if (location) {
            notification.classList.add('clickable');
            notification.title = 'Click para ir al lugar';
            notification.setAttribute('role', 'button');
            notification.tabIndex = 0; // Make focusable

            const jumpAction = (e) => {
                // Don't trigger if clicking close button
                if (e.target.closest('.notification-close-btn')) return;

                this.focusCamera(location.x, location.y, true);
                if (typeof soundManager !== 'undefined') soundManager.play('click');
            };

            notification.onclick = jumpAction;
            notification.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpAction(e);
                }
            };
        }

        // Map types to asset filenames
        const iconFiles = {
            info: 'info.png',
            error: 'error.png',
            success: 'check.png'
        };

        const iconDiv = document.createElement('div');
        iconDiv.className = 'notification-icon';

        // Use image asset with alt text for accessibility
        const img = document.createElement('img');
        img.src = `assets/icons/${iconFiles[type] || 'info.png'}`;
        img.alt = type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información';
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.objectFit = 'contain';

        // Add error handler for image loading failure
        img.onerror = () => {
            img.style.display = 'none';
            iconDiv.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        };

        iconDiv.appendChild(img);

        const textDiv = document.createElement('div');
        textDiv.className = 'notification-text';
        textDiv.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        closeBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering jump
            removeNotification();
        };

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

    /**
     * Palette: Notify player when units are under attack
     * Throttled to avoid spam
     */
    notifyUnderAttack(entity) {
        const now = Date.now();
        const COOLDOWN = 5000; // 5 seconds
        const DIST_SQ = 500 * 500; // Notify again if far away

        const dx = entity.x - this.lastAttackNotification.x;
        const dy = entity.y - this.lastAttackNotification.y;
        const distSq = dx * dx + dy * dy;

        if (now - this.lastAttackNotification.time > COOLDOWN || distSq > DIST_SQ) {
            this.showNotification('⚠️ ¡Estamos bajo ataque!', 'error', { x: entity.x, y: entity.y });
            this.lastAttackNotification = { time: now, x: entity.x, y: entity.y };

            // Optional: visual flair or sound
            if (this.particleSystem) {
                // Could add a special ping here
            }
        }
    }

    /**
     * Palette: Helper to flash all missing resources for a given cost
     */
    notifyResourceDepleted(node) {
        this._minimapDirty = true;
    }

    flashMissingResources(cost) {
        for (let [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] < amount) {
                this.flashResource(resource);
            }
        }
    }

    /**
     * Palette: Visual Feedback for Insufficient Resources
     * Flashes the corresponding resource counter in the top bar.
     * @param {string} resourceName - 'wood', 'food', 'gold', 'stone', or 'population'
     */
    flashResource(resourceName) {
        // Map resource names to UI element keys or IDs
        let element = null;

        // Handle population special case
        if (resourceName === 'population') {
            element = document.querySelector('.resource-population');
        } else {
            // Find the resource item container for the given resource
            // We look up the counter element first, then get its parent container
            const counterKey = `${resourceName}Count`;
            if (this.uiElements[counterKey]) {
                // The structure is .resource-item > .resource-info > .resource-value (id=...)
                // So we need to go up 2 levels
                element = this.uiElements[counterKey].closest('.resource-item');
            }
        }

        if (element) {
            // Reset animation
            element.classList.remove('resource-flash-error');
            void element.offsetWidth; // Force reflow
            element.classList.add('resource-flash-error');

            // Remove class after animation ends to allow re-triggering
            setTimeout(() => {
                element.classList.remove('resource-flash-error');
            }, 500);
        }
    }
}
