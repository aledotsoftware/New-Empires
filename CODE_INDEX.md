# 📚 Índice de Código - New Empires

**Versión**: 1.0.0  
**Última actualización**: 2025-12-02  
**Propósito**: Mapa de ubicación de toda la funcionalidad del código para referencia rápida

---

## 📁 Estructura de Carpetas

```
New-Empires/
├── js/                         # Código JavaScript modularizado
│   ├── core/                   # Lógica central del juego
│   ├── map/                    # Sistema de mapas y terrenos
│   ├── entities/               # Entidades del juego (unidades, edificios)
│   ├── managers/               # Gestores de sistemas
│   ├── ui/                     # Interfaz de usuario
│   └── utils/                  # Utilidades generales
├── assets/                     # Recursos del juego
│   ├── icons/                  # Iconos de unidades y edificios
│   ├── sound/                  # Efectos de sonido
│   └── civilization/           # Datos de civilizaciones (JSON)
├── docs/                       # Documentación
└── [archivos raíz]            # HTML, CSS y archivos legacy
```

---

## 🎮 Core - Lógica Central

### `js/core/constants.js`
**Responsabilidad**: Configuración y constantes del juego  
**Exporta**:
- `TILE_SIZE` - Tamaño de celda en píxeles (32px)
- `MAP_SIZES` - Definición de tamaños de mapa (tiny, small, medium, normal, large, giant, ludicrous)
- `TERRAIN_TYPES` - Tipos de terreno y sus propiedades (grassland, forest, water, mountain, hill, desert)
- `CONFIG` - Configuración general del juego (recursos iniciales, costos, tasas de recolección)

**Cuándo usar**: Cuando necesites acceder a valores de configuración globales

---

### `js/core/Game.js`
**Responsabilidad**: Clase principal del juego, orquesta todos los sistemas  
**Ubicación actual**: `game.js` (líneas 384-1680) - **PENDIENTE DE EXTRAER**  
**Funcionalidad**:
- Inicialización del juego
- Game loop principal
- Gestión de cámara
- Sistema de eventos (mouse, teclado)
- Selección de entidades
- Modo de construcción
- Renderizado principal

**Métodos clave**:
- `constructor(civId, mapConfig)` - Inicializa el juego
- `initializeGame()` - Configura estado inicial
- `update(deltaTime)` - Actualiza lógica del juego
- `render()` - Dibuja el juego en canvas
- `handleRightClick()` - Maneja comandos de unidades
- `placeBuilding()` - Coloca edificios

---

## 🗺️ Map - Sistema de Mapas

### `js/map/GridMap.js`
**Responsabilidad**: Gestión de cuadrícula para construcción y colisiones  
**Clase**: `GridMap`  
**Funcionalidad**:
- Divide el mapa en tiles de construcción
- Verifica espacios libres para edificios
- Ocupa/libera áreas del grid
- Snap to grid (ajuste a cuadrícula)

**Métodos clave**:
- `isAreaFree(startCol, startRow, widthTiles, heightTiles)` - Verifica si un área está libre
- `occupyArea(...)` - Marca área como ocupada
- `freeArea(...)` - Libera área ocupada
- `snapToGrid(x, y)` - Ajusta coordenadas al grid

---

### `js/map/TerrainMap.js`
**Responsabilidad**: Generación y gestión de tipos de terreno  
**Clase**: `TerrainMap`  
**Funcionalidad**:
- Generación procedural de terrenos
- Consulta de tipo de terreno en posición
- Validación de construcción según terreno

**Métodos clave**:
- `generateTerrain()` - Genera mapa procedural
- `getTerrainAt(x, y)` - Obtiene tipo de terreno en posición
- `canBuildAt(x, y, width, height)` - Verifica si se puede construir

**Tipos de terreno**:
- `grassland` - Terreno base, construible
- `forest` - Madera, no construible
- `water` - Agua, no construible, requiere barcos
- `mountain` - Piedra, impassable
- `hill` - Piedra, construible, bonos de defensa
- `desert` - Oro, construible

---

## 👥 Entities - Entidades del Juego

### `js/entities/Entity.js`
**Responsabilidad**: Clase base para todas las entidades  
**Ubicación actual**: `game.js` (líneas 1742-1830) - **PENDIENTE DE EXTRAER**  
**Propiedades comunes**:
- `x, y` - Posición
- `team` - Equipo ('player', 'enemy', 'neutral')
- `hp, maxHp` - Salud
- `size` - Tamaño para colisiones
- `icon` - Representación visual

**Métodos**:
- `loadIcon()` - Carga imagen del asset loader
- `takeDamage(amount)` - Recibe daño
- `update(deltaTime, game)` - Actualización por frame
- `render(ctx, camera)` - Dibuja entidad

---

### `js/entities/Unit.js`
**Responsabilidad**: Clase base para unidades móviles  
**Ubicación actual**: `game.js` (líneas 1835-2020) - **PENDIENTE DE EXTRAER**  
**Funcionalidad**:
- Movimiento y pathfinding
- Sistema de estados (IDLE, MOVING, GATHERING, ATTACKING)
- Detección de enemigos
- Ataque automático

**Estados de unidad**:
- `IDLE` - Sin hacer nada
- `MOVING` - Moviéndose a destino
- `GATHERING` - Recolectando recursos
- `ATTACKING` - Atacando enemigo
- `BUILDING` - Construyendo (aldeanos)

---

### `js/entities/units/Villager.js`
**Responsabilidad**: Aldeano - unidad de trabajo  
**Ubicación actual**: `game.js` (líneas 2025-2203) - **PENDIENTE DE EXTRAER**  
**Funcionalidad específica**:
- Recolección de recursos (madera, comida, oro, piedra)
- Construcción de edificios
- Transporte de recursos a depósitos
- Sistema de inventario

**Propiedades**:
- `gatherRate` - Velocidad de recolección
- `carryCapacity` - Capacidad de carga
- `carrying` - Recursos en inventario

---

### `js/entities/units/Warrior.js`
**Responsabilidad**: Guerrero - unidad de combate cuerpo a cuerpo  
**Ubicación actual**: `game.js` (líneas 2205-2217) - **PENDIENTE DE EXTRAER**  
**Stats**:
- HP: 100
- Ataque: 10
- Velocidad de ataque: 1.2s
- Rango: Cuerpo a cuerpo

---

### `js/entities/units/Archer.js`
**Responsabilidad**: Arquero - unidad de combate a distancia  
**Ubicación actual**: `game.js` (líneas 2219-2232) - **PENDIENTE DE EXTRAER**  
**Stats**:
- HP: 60
- Ataque: 8
- Velocidad de ataque: 1.5s
- Rango: 100px

---

### `js/entities/Building.js`
**Responsabilidad**: Clase base para edificios  
**Ubicación actual**: `game.js` (líneas 2237-2244) - **PENDIENTE DE EXTRAER**  
**Propiedades**:
- `isBuilding` - Flag de edificio
- `isUnderConstruction` - En construcción
- `constructionProgress` - Progreso de construcción

---

### `js/entities/buildings/TownCenter.js`
**Responsabilidad**: Centro Urbano - edificio principal  
**Ubicación actual**: `game.js` (líneas 2249-2259) - **PENDIENTE DE EXTRAER**  
**Funcionalidad**:
- Entrena aldeanos
- Punto de recolección de recursos
- HP: 2000
- Tamaño: 60px (5x5 tiles)

---

### `js/entities/buildings/House.js`
**Responsabilidad**: Casa - aumenta límite de población  
**Funcionalidad**: +5 población máxima  
**Costo**: 30 madera  
**HP**: 500

---

### `js/entities/buildings/Barracks.js`
**Responsabilidad**: Cuartel - entrena unidades militares  
**Funcionalidad**: Entrena guerreros y arqueros  
**Costo**: 175 madera  
**HP**: 1200

---

### Otros edificios
- `Storage.js` - Depósito general
- `StorageWood.js` - Depósito de madera
- `Market.js` - Mercado
- `Temple.js` - Templo
- `Workshop.js` - Taller

---

## 🎛️ Managers - Gestores de Sistemas

### `js/managers/AssetLoader.js`
**Responsabilidad**: Carga y gestión de imágenes  
**Clase**: `AssetLoader`  
**Funcionalidad**:
- Carga asíncrona de assets
- Tracking de progreso
- Manejo de errores de carga

**Uso**:
```javascript
import { assetLoader } from './js/managers/AssetLoader.js';
await assetLoader.loadAll();
const image = assetLoader.getImage('villager');
```

---

### `js/managers/SpatialGrid.js`
**Responsabilidad**: Optimización de búsquedas espaciales  
**Clase**: `SpatialGrid`  
**Funcionalidad**:
- Divide mapa en celdas
- Búsqueda rápida de entidades cercanas
- Reduce complejidad de O(n²) a O(n)

**Uso**:
```javascript
const grid = new SpatialGrid(width, height, 100);
grid.add(entity);
const nearby = grid.query(x, y, radius);
```

---

### `js/managers/TechManager.js`
**Responsabilidad**: Sistema de tecnologías  
**Ubicación**: `technologies.js` (archivo separado existente)  
**Funcionalidad**:
- Gestión de árbol tecnológico
- Investigación de tecnologías
- Aplicación de bonos

---

### `soundManager.js`
**Responsabilidad**: Gestión de audio  
**Ubicación**: Archivo raíz (existente)  
**Funcionalidad**:
- Reproducción de efectos de sonido
- Control de volumen
- Sonidos de selección y construcción

---

### `dataLoader.js`
**Responsabilidad**: Carga de datos JSON  
**Ubicación**: Archivo raíz (existente)  
**Funcionalidad**:
- Carga de civilizaciones
- Gestión de datos dinámicos

---

## 🖥️ UI - Interfaz de Usuario

### `index.html`
**Responsabilidad**: Estructura HTML del juego  
**Pantallas**:
- `#startScreen` - Pantalla de inicio
- `#mapSizeScreen` - Selección de tamaño de mapa
- `#civSelectionScreen` - Selección de civilización
- `#gameScreen` - Juego principal
- `#gameOverScreen` - Pantalla de fin de juego
- `#settingsScreen` - Configuración

**Elementos de juego**:
- `#gameCanvas` - Canvas principal
- `#minimapCanvas` - Minimapa
- `#unitControlPanel` - Panel de control de unidades
- `#buildMenu` - Menú de construcción
- `#techTreeScreen` - Árbol de tecnologías

---

### `styles.css`
**Responsabilidad**: Estilos principales  
**Secciones**:
- Reset y variables CSS
- Pantalla de inicio
- Interfaz de juego
- Paneles de recursos
- Minimapa

---

### `styles-patch.css`
**Responsabilidad**: Correcciones y adiciones de estilos  
**Contiene**: Reglas críticas de layout y overlay

---

### `tech-tree-styles.css`
**Responsabilidad**: Estilos del árbol de tecnologías  

---

## 🛠️ Utils - Utilidades

### `js/utils/DebugLogger.js`
**Responsabilidad**: Sistema centralizado de logging  
**Clase**: `DebugLogger`  
**Funcionalidad**:
- Logs categorizados (game, assets, sound, data, ui, performance)
- Niveles de log (debug, info, warn, error)
- Medición de rendimiento
- Estadísticas de errores

**Uso**:
```javascript
import { debugLogger } from './js/utils/DebugLogger.js';
debugLogger.info('Mensaje', 'game');
debugLogger.error('Error', 'game', error);
debugLogger.time('Operación', 'performance');
debugLogger.timeEnd('Operación', 'performance');
```

**Comandos de consola**:
- `debugLogger.showStats()` - Ver estadísticas
- `debugLogger.setLogLevel('debug')` - Cambiar nivel
- `debugLogger.toggleCategory('sound')` - Toggle categoría

---

### `mapGenerator.js`
**Responsabilidad**: Generación procedural de mapas  
**Ubicación**: Archivo raíz (existente)  
**Clase**: `ProceduralMapGenerator`  
**Funcionalidad**:
- Generación con semilla
- Biomas configurables
- Distribución de recursos

---

### `effects.js`
**Responsabilidad**: Efectos visuales  
**Ubicación**: Archivo raíz (existente)  
**Funcionalidad**:
- Partículas
- Animaciones

---

## 📦 Assets - Recursos

### `assets/icons/`
**Contenido**: Imágenes PNG de unidades y edificios  
**Formato**: PNG, tamaño variable  
**Archivos**:
- `villager.png`
- `warrior.png`
- `archer.png`
- `townCenter.png`
- `house.png`
- `barracks.png`
- `storage.png`
- etc.

---

### `assets/sound/`
**Contenido**: Efectos de sonido  
**Formato**: WAV  
**Archivos**:
- `selectVillager.wav`
- `selectWarrior.wav`
- `selectTownCenter.wav`
- `constructionComplete.wav`
- etc.

---

### `assets/civilization/`
**Contenido**: Datos de civilizaciones en JSON  
**Formato**: JSON  
**Archivos**:
- `sumeria.json`
- `egypt.json`
- `rome.json`
- etc.

**Estructura de civilización**:
```json
{
  "id": "sumeria",
  "name": "Sumeria",
  "description": "...",
  "bonuses": {
    "gatherRate": { "food": 1.1 },
    "buildSpeed": 1.15
  },
  "uniqueUnit": {...},
  "startingResources": {...}
}
```

---

## 🔄 Flujo de Inicialización

1. **Carga de HTML** (`index.html`)
2. **Carga de estilos** (con cache busting)
3. **Carga de scripts** (orden específico):
   - `debugLogger.js`
   - `effects.js`
   - `dataLoader.js`
   - `technologies.js`
   - `mapGenerator.js`
   - `soundManager.js`
   - `game.js`
4. **DOMContentLoaded**:
   - Inicializa debugLogger
   - Carga civilizaciones
   - Carga assets en background
   - Carga sonidos
   - Renderiza pantalla de inicio
5. **Selección de mapa y civilización**
6. **Inicio del juego**:
   - Crea instancia de `Game`
   - Genera mapa
   - Crea entidades iniciales
   - Inicia game loop

---

## 🎯 Guía Rápida de Búsqueda

### ¿Dónde está...?

**Sistema de recursos**:
- Constantes → `js/core/constants.js` (`CONFIG.GATHER_RATES`)
- Recolección → `js/entities/units/Villager.js`
- Nodos → `Game.resourceNodes` array

**Sistema de construcción**:
- Modo construcción → `Game.buildMode`, `Game.buildGhost`
- Validación → `GridMap.isAreaFree()`, `TerrainMap.canBuildAt()`
- Costos → `js/core/constants.js` (`CONFIG.COSTS`)

**Sistema de combate**:
- Detección → `Unit.findNearbyEnemy()`
- Ataque → `Unit.tryAttack()`
- Stats → Clases de unidades individuales

**Cámara**:
- Movimiento → `Game.updateCamera()`
- Configuración → `Game.cameraConfig`

**Minimapa**:
- Renderizado → `Game.renderMinimap()`
- Click → Event listener en `setupEventListeners()`

**Teclas de atajo**:
- Handler → `Game.handleKeyPress()`
- B → Abrir menú construcción
- Espacio → Centro urbano
- Tab → Próximo aldeano inactivo
- WASD/Flechas → Mover cámara

---

## 📋 Estado de Modularización

### ✅ Completado
- [x] `js/utils/DebugLogger.js`
- [x] `js/core/constants.js`
- [x] `js/map/GridMap.js`
- [x] `js/map/TerrainMap.js`
- [x] `js/managers/AssetLoader.js`
- [x] `js/managers/SpatialGrid.js`

### 🔄 Pendiente
- [ ] `js/core/Game.js` - Extraer clase Game
- [ ] `js/entities/Entity.js` - Clase base entidad
- [ ] `js/entities/Unit.js` - Clase base unidad
- [ ] `js/entities/Building.js` - Clase base edificio
- [ ] `js/entities/units/Villager.js`
- [ ] `js/entities/units/Warrior.js`
- [ ] `js/entities/units/Archer.js`
- [ ] `js/entities/buildings/TownCenter.js`
- [ ] `js/entities/buildings/House.js`
- [ ] `js/entities/buildings/Barracks.js`
- [ ] `js/entities/buildings/Storage.js`
- [ ] `js/entities/buildings/StorageWood.js`
- [ ] `js/entities/buildings/Market.js`
- [ ] `js/entities/buildings/Temple.js`
- [ ] `js/entities/buildings/Workshop.js`
- [ ] `js/ui/UIManager.js` - Gestión de UI
- [ ] Actualizar `index.html` para usar módulos ES6
- [ ] Crear archivo principal `main.js` como punto de entrada

---

## 🏗️ Arquitectura del Proyecto

### Principios
1. **Modularidad**: Cada clase en su propio archivo
2. **Separación de responsabilidades**: Carpetas por funcionalidad
3. **Exportaciones explícitas**: Uso de `export`/`import` ES6
4. **Sin duplicación**: Reutilización de código
5. **Documentación inline**: JSDoc en funciones clave

### Convenciones de Nombres
- **Archivos**: PascalCase para clases (`Game.js`, `Villager.js`)
- **Carpetas**: camelCase (`entities`, `managers`)
- **Clases**: PascalCase (`class Game`, `class Unit`)
- **Funciones/métodos**: camelCase (`update()`, `findNearby()`)
- **Constantes**: UPPER_SNAKE_CASE (`TILE_SIZE`, `CONFIG`)

---

## 📞 Contacto y Contribución

Para modificar este código:
1. Consulta este índice para ubicar la funcionalidad
2. Mantén la estructura modular
3. Actualiza este documento si agregas nuevos módulos
4. Usa el sistema de debug para logging

**Última revisión**: 2025-12-02  
**Mantenedor**: Sistema de modularización automática
