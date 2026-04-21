# 💻 Guía de Desarrollo - New Empires

**Última actualización**: 2026-01-10

---

## 🎯 Flujo de Navegación del Juego

```
┌─────────────────────────────────────────────────────────────┐
│                     CARGA DE APLICACIÓN                      │
│                                                               │
│  1. HTML cargado (index.html)                                │
│  2. CSS cargado (con cache busting)                          │
│  3. Scripts globales cargados:                               │
│     - effects.js                                             │
│     - dataLoader.js                                          │
│     - technologies.js                                        │
│     - mapGenerator.js                                        │
│     - soundManager.js                                        │
│  4. main.js (ES6 Module) cargado                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              DOMContentLoaded Event (main.js)                │
│                                                               │
│  1. populateMapSizes()                                       │
│  2. await dataLoader.initialize()                            │
│  3. populateCivilizations()                                  │
│  4. Inicializa otros sistemas                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   startScreen → mapSizeScreen → civSelectionScreen → JUEGO  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Dónde Modificar Código

### Panel de Control / UI
- **Archivo**: `js/core/Game.js`
- **Métodos**: `updateSelectionPanel()`, `updateActionsPanel()`
- **Hotkeys**: `handleKeyPress()`

### Construcción de Edificios
- **Archivo**: `js/core/Game.js`
- **Métodos**: `openBuildMenu()`, `closeBuildMenu()`, `placeBuilding()`

### Entrenar Unidades
- **Archivo**: `js/core/Game.js`
- **Método**: `trainUnit()`

### Movimiento/Cámara
- **Archivo**: `js/core/Game.js`
- **Métodos**: `updateCamera()`, `handleRightClick()`

### Funciones Globales (para HTML)
- **Archivo**: `main.js`
- **Patrón**: `window.nombreFuncion = function() { ... }`

---

## ⚠️ Regla de Oro: Archivos Activos vs Legacy

### ✅ Archivos ACTIVOS (Usar Estos)

| Archivo | Descripción |
|---------|-------------|
| `main.js` | Punto de entrada, coordina todo |
| `js/core/Game.js` | Clase principal del juego ⭐ |
| `js/core/constants.js` | Constantes globales |
| `js/entities/*` | Todas las entidades |
| `js/managers/*` | Todos los managers |
| `js/map/*` | Sistema de mapas |

### ❌ Archivos LEGACY (No Editar)

| Archivo | Razón |
|---------|-------|
| `game.js` (raíz) | Archivo monolítico antiguo, solo backup |
| `debugLogger.js` (raíz) | Reemplazado por módulo ES6 |

---

## 🔧 Flujo de Inicialización

```
1. index.html carga
   ↓
2. main.js se ejecuta (ES6 module)
   ↓
3. main.js importa Game desde js/core/Game.js
   ↓
4. Usuario selecciona civilización
   ↓
5. startGame() crea: game = window.game = new Game()
   ↓
6. Game.js inicia game loop
   ↓
7. gameLoop() llama game.update() y game.render()
```

---

## 📋 Checklist de Modificaciones

### ANTES de agregar/modificar funcionalidad:

- [ ] ¿El archivo está en `js/core/`, `js/entities/`, `js/managers/`?
- [ ] ¿Modifico `Game` en `js/core/Game.js` (correcto)?
- [ ] ¿Necesito exponer función globalmente en `main.js`?
- [ ] ¿Los imports están correctos?

### DESPUÉS de modificar:

- [ ] Recarga con `Ctrl + F5`
- [ ] Verificar que `window.game` existe
- [ ] Probar la funcionalidad
- [ ] Verificar consola sin errores

---

## 🆕 Cómo Agregar Nuevas Funcionalidades

### Agregar Nueva Unidad

1. Crear archivo en `js/entities/units/NuevaUnidad.js`:
```javascript
import { Unit } from '../Unit.js';

export class NuevaUnidad extends Unit {
    constructor(x, y, team = 'player') {
        super(x, y, team);
        this.type = 'nuevaUnidad';
        this.maxHp = 100;
        this.hp = 100;
        this.attack = 10;
        this.speed = 60;
        this.icon = 'nuevaUnidad';
        this.loadIcon();
    }
}
```

2. Exportar en `js/core/Game.js`:
```javascript
import { NuevaUnidad } from '../entities/units/NuevaUnidad.js';
```

3. Agregar ícono en `assets/icons/nuevaUnidad.png`

4. Agregar al menú de entrenamiento

---

### Agregar Nuevo Edificio

Similar al proceso de unidades:
1. Crear clase en `js/entities/buildings/`
2. Heredar de `Building`
3. Definir propiedades (HP, costo, tamaño)
4. Agregar al menú de construcción

---

### Agregar Nueva Civilización

Crear archivo en `assets/civilization/nueva-civ.json`:
```json
{
  "id": "nuevaCiv",
  "name": "Nueva Civilización",
  "icon": "🏛️",
  "color": "#d97706",
  "description": "Descripción...",
  "bonuses": {
    "gatherRate": { "food": 1.15 },
    "unitStats": { "attack": 1.10 }
  },
  "startingResources": {
    "wood": 0, "food": 50, "gold": 0, "stone": 0
  }
}
```

---

## 🐛 Debugging

### Verificar Estado del Juego

```javascript
// En consola del navegador:
console.log('game existe:', !!window.game);
console.log('es instancia:', window.game?.constructor?.name);
console.log('seleccionados:', window.game?.selectedEntities?.length);
```

### Activar Debug Completo

```javascript
debugLogger.setLogLevel('debug');
debugLogger.config.showStackTrace = true;
```

### Ver Estadísticas

```javascript
debugLogger.showStats();
debugLogger.showErrorHistory();
```

---

## 📝 Convenciones de Código

### Nombres de Archivos
- **Clases**: PascalCase (`Game.js`, `Villager.js`)
- **Carpetas**: camelCase (`entities`, `managers`)

### Nombres en Código
- **Clases**: PascalCase (`class Game`, `class Unit`)
- **Funciones/métodos**: camelCase (`update()`, `findNearby()`)
- **Constantes**: UPPER_SNAKE_CASE (`TILE_SIZE`, `CONFIG`)

### Commits
```
type: descripción breve

Types: feat, fix, docs, style, refactor, test, chore
Ejemplo: feat: add cavalry unit
```

---

## 🔄 Testing

### Verificación Manual

1. Probar en múltiples navegadores (Chrome, Firefox, Edge)
2. Verificar consola sin errores
3. Comprobar que funcionalidad existente no se rompe

### Checklist de Testing

- [ ] Iniciar partida nueva
- [ ] Seleccionar unidades/edificios
- [ ] Construir edificios
- [ ] Entrenar unidades
- [ ] Recolectar recursos
- [ ] Probar hotkeys
- [ ] Verificar minimapa

---

## 🚀 Tips Avanzados de Desarrollo

### Recargar Cambios Rápidamente

1. **Con Live Server**: Los cambios se recargan automáticamente
2. **Sin Live Server**: Usa `Ctrl + F5` para forzar recarga sin caché

### Depurar el Game Loop

```javascript
// Pausar el juego temporalmente
window.game.isPaused = true;

// Ver estado actual
console.log({
    fps: window.game.lastFPS,
    units: window.game.units.length,
    buildings: window.game.buildings.length,
    deltaTime: window.game.lastDeltaTime
});

// Reanudar
window.game.isPaused = false;
```

### Inspeccionar Entidades

```javascript
// Encontrar todas las unidades de un tipo
const villagers = window.game.units.filter(u => u.type === 'villager');
console.log('Aldeanos:', villagers.length);

// Ver estado de aldeano específico
const v = villagers[0];
console.log({
    estado: v.state,
    posicion: { x: v.x, y: v.y },
    inventario: v.carrying,
    hp: `${v.hp}/${v.maxHp}`
});
```

### Manipular Recursos (Debug)

```javascript
// Dar recursos infinitos (solo desarrollo)
window.game.resources = {
    wood: 99999,
    food: 99999,
    gold: 99999,
    stone: 99999
};
window.game.updateResourceDisplay();
```

### Probar Construcción

```javascript
// Forzar modo construcción
window.game.buildMode = 'house';
console.log('Modo construcción:', window.game.buildMode);

// Verificar validación de terreno
const canBuild = window.game.terrainMap.canBuildAt(100, 100, 2, 2);
console.log('Puede construir:', canBuild);
```

### Ver Pathfinding

```javascript
// Activar debug de pathfinding (si está implementado)
window.game.debugPathfinding = true;
```

---

## 📋 Checklist de Calidad

### Antes de hacer commit

- [ ] Sin errores en consola
- [ ] Funcionalidad probada manualmente
- [ ] Sin código comentado innecesario
- [ ] Nombres descriptivos de variables/funciones
- [ ] JSDoc en funciones públicas importantes

### Antes de hacer PR

- [ ] Rebased sobre main
- [ ] Todos los checkpoints arriba cumplidos
- [ ] Descripción clara del cambio
- [ ] Screenshots/videos si es cambio visual

---

## 🔗 Enlaces Rápidos

| Recurso | Ubicación |
|---------|-----------|
| Clase Game | `js/core/Game.js` |
| Constantes | `js/core/constants.js` |
| Entidades | `js/entities/` |
| Panel de Control | [PANEL_CONTROL.md](../sistemas/PANEL_CONTROL.md) |
| Hotkeys | [HOTKEYS.md](../sistemas/HOTKEYS.md) |
| Docker | [DOCKER.md](DOCKER.md) |

---

**Ver también**: [ARQUITECTURA.md](../arquitectura/ARQUITECTURA.md) | [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
