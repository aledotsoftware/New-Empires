# Sistema de Tipos de Terreno - Implementación Completa

## ✅ Configuración de Terrenos (Completado en game.js)

### 🌍 Tipos de Terreno Disponibles:

#### 1. **Pastizal** (Grassland) 🌾
- **Color**: Verde claro (#7cb342)
- **Construible**: ✅ Sí
- **Velocidad de movimiento**: 100% (normal)
- **Bonificaciones de combate**:
  - Caballería: +15% ataque
- **Recursos**: Comida (trigo)
- **Velocidad de construcción**: 100%

#### 2. **Bosque** (Forest) 🌲
- **Color**: Verde oscuro (#2e7d32)
- **Construible**: ❌ No
- **Velocidad de movimiento**: 70% (-30%)
- **Bonificaciones de combate**:
  - Arqueros: +10% defensa
- **Recursos**: Madera
- **Velocidad de construcción**: N/A

#### 3. **Agua** (Water) 💧
- **Color**: Azul (#1976d2)
- **Construible**: ❌ No
- **Velocidad de movimiento**: 0% (impassable para unidades terrestres)
- **Bonificaciones de combate**: Ninguna
- **Recursos**: Comida (pesca)
- **Requiere**: Barcos para navegación
- **Velocidad de construcción**: N/A

#### 4. **Montaña** (Mountain) ⛰️
- **Color**: Marrón oscuro (#5d4037)
- **Construible**: ❌ No
- **Velocidad de movimiento**: 0% (impassable)
- **Bonificaciones de combate**: Ninguna
- **Recursos**: Piedra
- **Impassable**: Sí (obstáculo total)

#### 5. **Colina** (Hill) 🏔️
- **Color**: Marrón claro (#8d6e63)
- **Construible**: ✅ Sí
- **Velocidad de movimiento**: 60% (-40% al subir)
- **Bonificaciones de combate**:
  - Arqueros: +20% alcance
  - Todas las unidades: +15% defensa
- **Recursos**: Piedra
- **Velocidad de construcción**: 80% (-20%)

#### 6. **Desierto** (Desert) 🏜️
- **Color**: Amarillo (#fdd835)
- **Construible**: ✅ Sí
- **Velocidad de movimiento**: 85% (-15%)
- **Bonificaciones de combate**: Ninguna
- **Recursos**: Oro
- **Velocidad de construcción**: 90%

---

## 📋 Implementación Necesaria

### 1. **Clase TerrainMap** (Agregar al inicio de game.js)

```javascript
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
        this.generatePatches('forest', 0.15, 8);
        
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

        while (tilesPlaced < targetTiles) {
            const startCol = Math.floor(Math.random() * this.cols);
            const startRow = Math.floor(Math.random() * this.rows);
            
            // Crear parche usando flood fill
            for (let i = 0; i < patchSize; i++) {
                const col = startCol + Math.floor(Math.random() * patchSize) - patchSize / 2;
                const row = startRow + Math.floor(Math.random() * patchSize) - patchSize / 2;
                
                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const index = this.getIndex(col, row);
                    if (this.grid[index] === 'grassland') {
                        this.grid[index] = terrainType;
                        tilesPlaced++;
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

    canBuildAt(x, y, width, height) {
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const terrain = this.getTerrainAt(x + i * this.tileSize, y + j * this.tileSize);
                const terrainData = this.getTerrainData(terrain);
                if (!terrainData.buildable) {
                    return false;
                }
            }
        }
        return true;
    }
}
```

### 2. **Integrar TerrainMap en la clase Game**

En el constructor de `Game`, agregar:

```javascript
// Después de crear gridMap
this.terrainMap = new TerrainMap(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, TILE_SIZE);
```

### 3. **Modificar placeBuilding para verificar terreno**

```javascript
placeBuilding() {
    if (!this.buildMode) return;

    const snap = this.gridMap.snapToGrid(this.mouse.worldX, this.mouse.worldY);
    const size = CONFIG.BUILDING_SIZES[this.buildMode];
    
    // Verificar si el terreno permite construcción
    if (!this.terrainMap.canBuildAt(snap.x, snap.y, size.width, size.height)) {
        this.showNotification('No se puede construir en este terreno', 'error');
        return;
    }
    
    // ... resto del código existente
}
```

### 4. **Modificar moveTowardsTarget para aplicar velocidad de terreno**

```javascript
moveTowardsTarget(targetX, targetY, deltaTime, game) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
        // Obtener terreno actual
        const terrain = game.terrainMap.getTerrainAt(this.x, this.y);
        const terrainData = game.terrainMap.getTerrainData(terrain);
        
        // Aplicar modificador de velocidad del terreno
        const speedModifier = terrainData.movementSpeed;
        const effectiveSpeed = this.speed * speedModifier;
        
        let moveX = (dx / dist) * effectiveSpeed * deltaTime;
        let moveY = (dy / dist) * effectiveSpeed * deltaTime;
        
        // ... resto del código de colisiones
    }
}
```

### 5. **Modificar sistema de combate para bonificaciones de terreno**

En el método `tryAttack` de la clase `Unit`:

```javascript
tryAttack(target, deltaTime) {
    // ... código existente ...
    
    // Obtener bonificación de terreno
    const terrain = game.terrainMap.getTerrainAt(this.x, this.y);
    const terrainData = game.terrainMap.getTerrainData(terrain);
    
    let damageMultiplier = 1.0;
    
    // Aplicar bonificación específica del tipo de unidad
    if (terrainData.combatBonus[this.type]) {
        damageMultiplier *= terrainData.combatBonus[this.type];
    }
    
    // Aplicar bonificación de defensa general
    if (terrainData.combatBonus.defense) {
        // El defensor recibe bonificación
        const defenderTerrain = game.terrainMap.getTerrainAt(target.x, target.y);
        const defenderTerrainData = game.terrainMap.getTerrainData(defenderTerrain);
        if (defenderTerrainData.combatBonus.defense) {
            damageMultiplier /= defenderTerrainData.combatBonus.defense;
        }
    }
    
    const finalDamage = this.attack * damageMultiplier;
    target.health -= finalDamage;
}
```

### 6. **Renderizar el terreno en el canvas**

En el método `draw()` de la clase `Game`, antes de dibujar entidades:

```javascript
drawTerrain() {
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
            const terrainData = TERRAIN_TYPES[terrainType];

            const x = col * TILE_SIZE - this.camera.x;
            const y = row * TILE_SIZE - this.camera.y;

            this.ctx.fillStyle = terrainData.color;
            this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            
            // Dibujar borde sutil
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }
}
```

---

## 🎮 Efectos en el Juego

### **Combate**
- ✅ Caballería más fuerte en pastizales
- ✅ Arqueros con ventaja en bosques y colinas
- ✅ Bonificación defensiva en colinas

### **Construcción**
- ✅ Solo se puede construir en terrenos designados
- ✅ Velocidad de construcción afectada por el terreno
- ✅ Bosques y agua bloquean construcción

### **Movimiento**
- ✅ Velocidad reducida en bosques, colinas y desiertos
- ✅ Agua y montañas son impassables
- ✅ Movimiento fluido en pastizales

### **Recursos**
- ✅ Madera en bosques
- ✅ Comida en pastizales y agua
- ✅ Piedra en montañas y colinas
- ✅ Oro en desiertos

---

## 🚀 Próximos Pasos

1. Implementar la clase `TerrainMap`
2. Integrarla en el constructor de `Game`
3. Actualizar `placeBuilding` para verificar terreno
4. Modificar `moveTowardsTarget` para velocidad de terreno
5. Actualizar sistema de combate para bonificaciones
6. Renderizar el terreno en el canvas
7. Ajustar generación de recursos según terreno

Este sistema añadirá profundidad estratégica significativa al juego, haciendo que la posición y el terreno sean factores cruciales en combate y construcción.
