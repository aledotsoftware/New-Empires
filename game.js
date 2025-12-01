// ==========================================
// CONFIGURACIÓN DEL JUEGO
// ==========================================
const CONFIG = {
    CANVAS_WIDTH: 2000,
    CANVAS_HEIGHT: 1500,
    
    // Recursos iniciales
    STARTING_WOOD: 200,
    STARTING_FOOD: 200,
    STARTING_GOLD: 100,
    STARTING_STONE: 100,
    
    // Población
    STARTING_POPULATION: 3,
    STARTING_MAX_POPULATION: 5,
    HOUSE_POPULATION_INCREASE: 5,
    
    // Costos de construcción
    COSTS: {
        house: { wood: 30 },
        barracks: { wood: 175 },
        townCenter: { wood: 275, stone: 100 },
        storage: { wood: 100 }
    },
    
    // Costos de unidades
    UNIT_COSTS: {
        villager: { food: 50 },
        warrior: { food: 60, gold: 20 },
        archer: { food: 50, gold: 40, wood: 25 }
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
// CLASE PRINCIPAL DEL JUEGO
// ==========================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimap = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimap.getContext('2d');
        
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
        this.cameraSpeed = 10;
        
        // Mouse
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        // Modo de construcción
        this.buildMode = null;
        this.buildGhost = null;
        
        this.setupEventListeners();
        this.initializeGame();this.updateUI();
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
        // Generar nodos de recursos
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
        this.canvas.addEventListener('mousemove', (e) => {
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
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
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
        
        // Comandar unidades
        for (let entity of this.selectedEntities) {
            if (entity.isUnit) {
                if (targetEnemy && entity.canAttack) {
                    entity.attackTarget = targetEnemy;
                    entity.gatherTarget = null;
                    entity.targetX = null;
                } else if (targetResource && entity.canGather) {
                    entity.gatherTarget = targetResource;
                    entity.attackTarget = null;
                    entity.targetX = null;
                } else {
                    entity.targetX = this.mouse.worldX;
                    entity.targetY = this.mouse.worldY;
                    entity.attackTarget = null;
                    entity.gatherTarget = null;
                }
            }
        }
    }
    
    handleKeyPress(e) {
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
        
        // Space - Center on town center
        if (e.key === ' ') {
            e.preventDefault();
            const tc = this.buildings.find(b => b.type === 'townCenter' && b.team === 'player');
            if (tc) {
                this.camera.x = tc.x - this.viewWidth / 2;
                this.camera.y = tc.y - this.viewHeight / 2;
            }
        }
        
        // WASD - Camera movement
        const speed = this.cameraSpeed;
        if (e.key === 'w' || e.key === 'W') this.camera.y -= speed;
        if (e.key === 's' || e.key === 'S') this.camera.y += speed;
        if (e.key === 'a' || e.key === 'A') this.camera.x -= speed;
        if (e.key === 'd' || e.key === 'D') this.camera.x += speed;
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
        
        const cost = CONFIG.COSTS[this.buildMode];
        if (!this.canAfford(cost)) {
            this.showNotification('Recursos insuficientes', 'error');
            return;
        }
        
        // Deducir recursos
        for (let [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }
        
        // Crear edificio
        let building;
        switch(this.buildMode) {
            case 'house':
                building = new House(this.mouse.worldX, this.mouse.worldY, 'player');
                this.maxPopulation += CONFIG.HOUSE_POPULATION_INCREASE;
                break;
            case 'barracks':
                building = new Barracks(this.mouse.worldX, this.mouse.worldY, 'player');
                break;
            case 'townCenter':
                building = new TownCenter(this.mouse.worldX, this.mouse.worldY, 'player');
                break;
            case 'storage':
                building = new Storage(this.mouse.worldX, this.mouse.worldY, 'player');
                break;
        }
        
        if (building) {
            this.buildings.push(building);
            this.entities.push(building);
            this.showNotification(`${building.name} construido`, 'success');
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
        switch(unitType) {
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
            this.units.push(unit);
            this.entities.push(unit);
            this.population++;
            this.showNotification(`${unit.name} entrenado`, 'success');
            this.updateUI();
        }
    }
    
    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;
        
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
            message.textContent ='¡Has derrotado a todos los enemigos!';
        } else {
            title.textContent = '💀 Derrota';
            title.style.background = 'linear-gradient(135deg, #c53030, #9b2c2c)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            message.textContent = 'Tu Centro Urbano ha sido destruido.';
        }
        
        screen.classList.remove('hidden');
    }
    
    render() {
        // Limpiar canvas
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar grid
        this.drawGrid();
        
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
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 100;
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
        const screenX = this.mouse.worldX - this.camera.x;
        const screenY = this.mouse.worldY - this.camera.y;
        
        let size = 40;
        let icon = '🏗️';
        
        switch(this.buildMode) {
            case 'house':
                icon = '🏠';
                size = 30;
                break;
            case 'barracks':
                icon = '⚔️';
                size = 50;
                break;
            case 'townCenter':
                icon = '🏰';
                size = 60;
                break;
            case 'storage':
                icon = '📦';
                size = 40;
                break;
        }
        
        this.ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
        this.ctx.strokeStyle = '#d4af37';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icon, screenX, screenY);
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
            this.minimapCtx.fillStyle = building.team === 'player' ? '#48bb78' : '#c53030';
            this.minimapCtx.fillRect(
                building.x * scale - 2,
                building.y * scale - 2,
                4, 4
            );
        }
        
        // Unidades
        for (let unit of this.units) {
            this.minimapCtx.fillStyle = unit.team === 'player' ? '#3182ce' : '#e53e3e';
            this.minimapCtx.fillRect(
                unit.x * scale - 1,
                unit.y * scale - 1,
                2, 2
            );
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
    }
    
    updateSelectionPanel() {
        const content = document.getElementById('selectionContent');
        
        if (this.selectedEntities.length === 0) {
            content.innerHTML = '<p class="no-selection">Ninguna unidad seleccionada</p>';
            return;
        }
        
        if (this.selectedEntities.length === 1) {
            const entity = this.selectedEntities[0];
            content.innerHTML = `
                <div class="unit-info">
                    <div class="unit-header">
                        <div class="unit-icon-large">${entity.icon}</div>
                        <div class="unit-details">
                            <h3>${entity.name}</h3>
                            <div class="unit-type">${entity.type}</div>
                        </div>
                    </div>
                    <div class="unit-stats">
                        <div class="stat-row">
                            <span class="stat-label">Vida:</span>
                            <div class="health-bar">
                                <div class="health-fill" style="width: ${(entity.hp / entity.maxHp) * 100}%"></div>
                            </div>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">HP:</span>
                            <span class="stat-value">${Math.floor(entity.hp)} / ${entity.maxHp}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="unit-info">
                    <h3>${this.selectedEntities.length} unidades seleccionadas</h3>
                </div>
            `;
        }
    }
    
    updateActionsPanel() {
        const grid = document.getElementById('actionsGrid');
        grid.innerHTML = '';
        
        if (this.selectedEntities.length !== 1) return;
        
        const entity = this.selectedEntities[0];
        
        if (entity.type === 'villager') {
            grid.innerHTML = `
                <div class="action-button" onclick="game.openBuildMenu()">
                    <div class="action-icon">🏗️</div>
                    <div class="action-name">Construir</div>
                    <div class="action-cost">B</div>
                </div>
            `;
        } else if (entity.type === 'townCenter') {
            const cost = CONFIG.UNIT_COSTS.villager;
            const canAfford = this.canAfford(cost);
            
            grid.innerHTML = `
                <div class="action-button ${!canAfford ? 'disabled' : ''}" 
                     onclick="if(this.classList.contains('disabled')) return; game.trainUnit('villager', game.selectedEntities[0])">
                    <div class="action-icon">👨‍🌾</div>
                    <div class="action-name">Aldeano</div>
                    <div class="action-cost">🌾${cost.food}</div>
                </div>
            `;
        } else if (entity.type === 'barracks') {
            const warriorCost = CONFIG.UNIT_COSTS.warrior;
            const archerCost = CONFIG.UNIT_COSTS.archer;
            const canAffordWarrior = this.canAfford(warriorCost);
            const canAffordArcher = this.canAfford(archerCost);
            
            grid.innerHTML = `
                <div class="action-button ${!canAffordWarrior ? 'disabled' : ''}" 
                     onclick="if(this.classList.contains('disabled')) return; game.trainUnit('warrior', game.selectedEntities[0])">
                    <div class="action-icon">⚔️</div>
                    <div class="action-name">Guerrero</div>
                    <div class="action-cost">🌾${warriorCost.food} 💰${warriorCost.gold}</div>
                </div>
                <div class="action-button ${!canAffordArcher ? 'disabled' : ''}" 
                     onclick="if(this.classList.contains('disabled')) return; game.trainUnit('archer', game.selectedEntities[0])">
                    <div class="action-icon">🏹</div>
                    <div class="action-name">Arquero</div>
                    <div class="action-cost">🌾${archerCost.food} 💰${archerCost.gold}</div>
                </div>
            `;
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
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
        
        // Círculo de fondo
        ctx.fillStyle = this.getTeamColor();
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = `${this.size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, screenX, screenY);
        
        // Barra de vida
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
        switch(this.team) {
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
        this.isUnit = true;
        this.speed = 50;
        this.targetX = null;
        this.targetY = null;
        this.attackTarget = null;
        this.gatherTarget = null;
        this.attackDamage = 5;
        this.attackSpeed = 1; // ataques por segundo
        this.attackRange = 30;
        this.attackCooldown = 0;
        this.canAttack = false;
        this.canGather = false;
    }
    
    update(deltaTime, game) {
        // IA básica: atacar enemigos cercanos
        if (!this.attackTarget && this.canAttack) {
            this.findNearbyEnemy(game);
        }
        
        // Atacar objetivo
        if (this.attackTarget) {
            if (this.attackTarget.isDead) {
                this.attackTarget = null;
            } else {
                this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime);
                this.tryAttack(this.attackTarget, deltaTime);
            }
        }
        // Recolectar recurso
        else if (this.gatherTarget && this.canGather) {
            if (this.gatherTarget.amount <= 0) {
                this.gatherTarget = null;
            } else {
                this.moveTowardsTarget(this.gatherTarget.x, this.gatherTarget.y, deltaTime);
                this.tryGather(this.gatherTarget, deltaTime, game);
            }
        }
        // Moverse a posición
        else if (this.targetX !== null) {
            this.moveTowardsTarget(this.targetX, this.targetY, deltaTime);
            
            const dist = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (dist < 10) {
                this.targetX = null;
                this.targetY = null;
            }
        }
        
        // Actualizar cooldown de ataque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
    
    findNearbyEnemy(game) {
        const searchRadius = 200;
        const enemies = this.team === 'player' ? game.enemies : game.units.filter(u => u.team === 'player');
        
        for (let enemy of enemies) {
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < searchRadius) {
                this.attackTarget = enemy;
                break;
            }
        }
    }
    
    moveTowardsTarget(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
            const moveX = (dx / dist) * this.speed * deltaTime;
            const moveY = (dy / dist) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
            
            // Límites del mapa
            this.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH, this.x));
            this.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT, this.y));
        }
    }
    
    tryAttack(target, deltaTime) {
        const dist = Math.hypot(this.x - target.x, this.y - target.y);
        
        if (dist <= this.attackRange && this.attackCooldown <= 0) {
            target.takeDamage(this.attackDamage);
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
        this.size = 15;
        this.attackDamage = 3;
        this.canAttack = true;
        this.canGather = true;
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
        this.size = 16;
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
        this.size = 15;
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

// ==========================================
// GAME LOOP
// ==========================================
let game;
let lastTime = 0;

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
    lastTime = currentTime;
    
    if (game) {
        game.update(Math.min(deltaTime, 0.1)); // Limitar delta para evitar saltos grandes
        game.render();
    }
    
    requestAnimationFrame(gameLoop);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Pantalla de inicio
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    // Crear partículas de fondo
    createParticles();
    
    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Iniciar juego
        game = new Game();
        requestAnimationFrame(gameLoop);
    });
    
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
function closeBuildMenu() {
    document.getElementById('buildMenu').classList.add('hidden');
}
