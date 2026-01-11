# 🔧 Plan de Mejoras de Código - New Empires

**Fecha de creación**: 2026-01-10
**Estado**: En progreso

---

## 📋 Resumen de Fases

| Fase | Nombre | Prioridad | Tiempo Estimado | Estado |
|------|--------|-----------|-----------------|--------|
| 1 | Limpieza y Corrección de Bugs | 🔴 Alta | 30 min | ⏳ Pendiente |
| 2 | Eliminación de Código Duplicado | 🔴 Alta | 45 min | ⏳ Pendiente |
| 3 | Modularización de Scripts Globales | 🟡 Media | 2-3 horas | ⏳ Pendiente |
| 4 | Optimización de Rendimiento | 🟡 Media | 1-2 horas | ⏳ Pendiente |
| 5 | Nuevas Funcionalidades | 🟢 Baja | Variable | ⏳ Pendiente |

---

## 🗑️ FASE 1: Limpieza y Corrección de Bugs

### 1.1 Actualizar lista de civilizaciones
**Archivo**: `dataLoader.js`
**Línea**: 26
**Cambio**: Agregar las 7 civilizaciones faltantes

```javascript
// ANTES
this.AVAILABLE_CIVS = ['mongols', 'sumeria', 'romans', 'vikings', 'argentinians'];

// DESPUÉS
this.AVAILABLE_CIVS = [
    'mongols', 'sumeria', 'romans', 'vikings', 'argentinians',
    'babylon', 'byzantium', 'caliphate', 'egypt', 'greece', 'persia', 'spain'
];
```

### 1.2 Corregir getStartingResources
**Archivo**: `game.js`
**Línea**: 23-26
**Problema**: Busca en ubicación incorrecta

```javascript
// ANTES
getStartingResources: (id) => {
    const civ = dataLoader.getCivilizationData(id);
    return civ ? (civ.startingResources || {}) : {};
},

// DESPUÉS
getStartingResources: (id) => {
    const civ = dataLoader.getCivilizationData(id);
    return civ?.bonuses?.startingResources || {};
},
```

### 1.3 Eliminar archivos obsoletos
```bash
rm civilizations-old.js
rm civilizations-old.json
rm drawCustomCursor.txt
rm index_scripts_patch.html
rm temp-link.txt
rm INSTRUCCIONES_CURSOR.txt
rm -rf backup_styles/
```

### 1.4 Renombrar game.legacy.js
```bash
mv game.legacy.js _deprecated/game.legacy.js
```

**Estado**: [ ] Completado

---

## 🗑️ FASE 2: Eliminación de Código Duplicado

### 2.1 Verificar que game.js no se carga con ES6
**Archivo**: `index.html`
**Acción**: Confirmar que solo se carga el sistema modular

### 2.2 Crear backup de game.js
```bash
mkdir -p _deprecated
mv game.js _deprecated/game.js.backup
```

### 2.3 Verificar funcionamiento
- Ejecutar el juego
- Verificar que todo funcione con solo modules ES6
- Si falla, identificar dependencias faltantes

**Estado**: [ ] Completado

---

## 📦 FASE 3: Modularización de Scripts Globales

### 3.1 Convertir dataLoader.js a ES6 module

**Crear**: `js/managers/DataLoader.js`

```javascript
// js/managers/DataLoader.js
export class DataLoader {
    // ... mismo código pero con export
}

export const dataLoader = new DataLoader();
```

**Actualizar**: `main.js`
```javascript
import { dataLoader } from './js/managers/DataLoader.js';
```

### 3.2 Convertir soundManager.js a ES6 module

**Crear**: `js/managers/SoundManager.js`

```javascript
export class SoundManager {
    // ... código existente
}

export const soundManager = new SoundManager();
```

### 3.3 Convertir debugLogger.js a ES6 module

**Ya existe** en `js/utils/DebugLogger.js`, verificar que se use.

### 3.4 Convertir technologies.js a ES6 module

**Crear**: `js/data/Technologies.js`

```javascript
export const TECHNOLOGIES = [...];
export class TechManager {
    // ... código existente
}
```

### 3.5 Convertir mapGenerator.js a ES6 module

**Crear**: `js/map/ProceduralMapGenerator.js`

```javascript
export class ProceduralMapGenerator {
    // ... código existente
}
```

### 3.6 Convertir effects.js a ES6 module

**Crear**: `js/utils/Effects.js`

```javascript
export class EffectsManager {
    // ... código existente
}
```

### 3.7 Actualizar index.html
Eliminar todos los `<script>` globales y usar solo el module entry point.

**Estado**: [ ] Completado

---

## ⚡ FASE 4: Optimización de Rendimiento

### 4.1 Optimizar remoción de entidades muertas
**Archivo**: `js/core/Game.js`
**Método**: `update()`

```javascript
// Agregar función helper
_removeDeadInPlace(array) {
    let writeIdx = 0;
    for (let i = 0; i < array.length; i++) {
        if (!array[i].isDead) {
            array[writeIdx++] = array[i];
        }
    }
    array.length = writeIdx;
}

// Usar en update()
if (hasDeadEntities) {
    this._removeDeadInPlace(this.entities);
    this._removeDeadInPlace(this.units);
    this._removeDeadInPlace(this.buildings);
    this._removeDeadInPlace(this.enemies);
    // ...
}
```

### 4.2 Optimizar updateUI con dirty flags
**Archivo**: `js/core/Game.js`
**Método**: `updateUI()`

```javascript
updateUI() {
    // Solo actualizar si cambió
    if (this._lastResources?.wood !== this.resources.wood) {
        document.getElementById('woodCount').textContent = this.resources.wood;
    }
    // ... etc
    this._lastResources = { ...this.resources };
}
```

### 4.3 Agregar cleanup de event listeners
**Archivo**: `js/core/Game.js`

```javascript
constructor() {
    // Guardar referencias
    this._resizeHandler = () => this.resizeCanvas();
    window.addEventListener('resize', this._resizeHandler);
}

destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    // Limpiar otros listeners
}
```

### 4.4 Reemplazar constantes mágicas
**Archivo**: `js/core/constants.js`

```javascript
// Agregar constantes descriptivas
export const GAMEPLAY = {
    MIN_SPAWN_DISTANCE: 200,
    GATHER_INTERVAL: 1.0,
    AI_CHECK_INTERVAL: 0.5,
    UI_UPDATE_INTERVAL: 100, // ms
};
```

**Estado**: [ ] Completado

---

## ✨ FASE 5: Nuevas Funcionalidades

### 5.1 Sistema de Guardado/Carga
**Crear**: `js/managers/SaveManager.js`

```javascript
export class SaveManager {
    save(game) {
        const state = this._serializeGameState(game);
        localStorage.setItem('newempires_save', JSON.stringify(state));
    }
    
    load() {
        const data = localStorage.getItem('newempires_save');
        return data ? JSON.parse(data) : null;
    }
    
    _serializeGameState(game) {
        return {
            version: '1.0',
            timestamp: Date.now(),
            civilizationId: game.civilizationId,
            resources: game.resources,
            units: game.units.map(u => this._serializeEntity(u)),
            buildings: game.buildings.map(b => this._serializeEntity(b)),
            // ...
        };
    }
}
```

### 5.2 Cola de Producción
**Crear**: `js/systems/ProductionQueue.js`

```javascript
export class ProductionQueue {
    constructor(building) {
        this.building = building;
        this.queue = [];
        this.maxSize = 5;
    }
    
    enqueue(unitType, cost, productionTime) {
        if (this.queue.length >= this.maxSize) return false;
        this.queue.push({ unitType, cost, remaining: productionTime, total: productionTime });
        return true;
    }
    
    update(deltaTime) {
        if (this.queue.length === 0) return null;
        
        this.queue[0].remaining -= deltaTime;
        if (this.queue[0].remaining <= 0) {
            return this.queue.shift();
        }
        return null;
    }
    
    getProgress() {
        if (this.queue.length === 0) return 0;
        return 1 - (this.queue[0].remaining / this.queue[0].total);
    }
}
```

### 5.3 Sistema de Formaciones
**Crear**: `js/systems/FormationManager.js`

```javascript
export const FORMATIONS = {
    line: (units, center, spacing = 40) => {
        const positions = [];
        const startX = center.x - ((units.length - 1) * spacing) / 2;
        units.forEach((unit, i) => {
            positions.push({ x: startX + i * spacing, y: center.y });
        });
        return positions;
    },
    
    box: (units, center, spacing = 40) => {
        const positions = [];
        const side = Math.ceil(Math.sqrt(units.length));
        units.forEach((unit, i) => {
            const row = Math.floor(i / side);
            const col = i % side;
            positions.push({
                x: center.x + (col - side/2) * spacing,
                y: center.y + (row - side/2) * spacing
            });
        });
        return positions;
    }
};
```

**Estado**: [ ] Completado

---

## 📊 Progreso General

- [ ] Fase 1: Limpieza y Bugs
- [ ] Fase 2: Código Duplicado
- [ ] Fase 3: Modularización
- [ ] Fase 4: Optimización
- [ ] Fase 5: Nuevas Features

---

## 📝 Notas de Implementación

_(Se actualizará durante la ejecución)_
