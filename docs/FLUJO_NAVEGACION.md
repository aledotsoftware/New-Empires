# 🗺️ Flujo de Navegación - New Empires

## Diagrama de Flujo Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│                     CARGA DE APLICACIÓN                      │
│                                                               │
│  1. HTML cargado (index.html)                                │
│  2. CSS cargado (con cache busting)                          │
│  3. Scripts globales cargados:                               │
│     - debugLogger.js                                         │
│     - effects.js                                             │
│     - dataLoader.js  ← IMPORTANTE: Define dataLoader global │
│     - technologies.js                                        │
│     - mapGenerator.js                                        │
│     - soundManager.js                                        │
│  4. main.js (ES6 Module) cargado                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              DOMContentLoaded Event (main.js)                │
│                                                               │
│  1. ✅ populateMapSizes()                                    │
│     → Genera opciones: tiny, small, medium, normal,          │
│       large, giant, ludicrous                                │
│     → Agrega event listeners dinámicamente                   │
│                                                               │
│  2. ✅ await dataLoader.initialize()                         │
│     → Carga base_technologies.json                           │
│     → Carga base_buildings.json                              │
│     → Carga base_units.json                                  │
│     → Carga civilizaciones en paralelo:                      │
│       • argentinians.json                                    │
│       • mongols.json                                         │
│       • romans.json                                          │
│       • sumeria.json                                         │
│       • vikings.json                                         │
│                                                               │
│  3. ✅ populateCivilizations()                               │
│     → Obtiene civilizaciones de dataLoader                   │
│     → Crea tarjetas con icono, nombre, descripción           │
│     → Agrega event listeners dinámicamente                   │
│                                                               │
│  4. ✅ Inicializa otros sistemas                             │
│     → Carga assets (imágenes)                                │
│     → Inicializa soundManager                                │
│     → Renderiza tech tree estático                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PANTALLA DE INICIO                          │
│                    (startScreen)                              │
│                                                               │
│  Opciones:                                                    │
│  • [⚔️ Comenzar Juego 🏰]  ← Click aquí                     │
│  • [📜 Árbol de Tecnologías]                                │
│  • [⚙️ Configuración]                                        │
│                                                               │
│  Controles mostrados                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              SELECCIÓN DE TAMAÑO DE MAPA                      │
│                   (mapSizeScreen)                             │
│                                                               │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │ 🗺️ Tiny│🗺️ Small│🗺️ Med  │🗺️ Norm │  ← Click uno    │
│  │ 50×50  │ 75×75  │ 100×100│ 120×120│                    │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│  ┌─────────┬─────────┬─────────┐                           │
│  │🗺️ Large│🗺️ Giant│🗺️ Ludic│                           │
│  │ 150×150│ 200×200│ 255×255│                             │
│  └─────────┴─────────┴─────────┘                           │
│                                                               │
│  [⬅ Volver]                                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             SELECCIÓN DE CIVILIZACIÓN                         │
│                (civSelectionScreen)                           │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ 🐎       │ 🏛️       │ 🏛️       │ 🏛️       │ ⚔️       │  │
│  │ Mongols  │ Sumeria  │ Romans   │ Vikings  │Argentina │  │
│  │ Fast     │ Economy  │ Infantry │ Naval    │ Cavalry  │  │
│  │ cavalry  │ bonus    │ focus    │ power    │ focus    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│         ↑                                                     │
│  ✅ AHORA SE MUESTRAN DINÁMICAMENTE                          │
│                                                               │
│  [⬅ Volver al Tamaño de Mapa]                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  INICIAR PARTIDA                              │
│                                                               │
│  • Crea instancia de Game(civId, mapConfig)                  │
│  • Genera mapa procedural                                    │
│  • Crea entidades iniciales (Centro Urbano, Aldeanos)        │
│  • Inicia game loop (update + render)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PANTALLA DE JUEGO                           │
│                    (gameScreen)                               │
│                                                               │
│  [Recursos] [Población] [Tiempo] [⚙️Config]                 │
│  ┌──────────────────────────────────────┬────────┐          │
│  │                                       │ Mini-  │          │
│  │         CANVAS DE JUEGO               │ mapa   │          │
│  │         (Map, Units, Buildings)       │        │          │
│  │                                       │        │          │
│  └──────────────────────────────────────┴────────┘          │
│                              ┌──────────────────┐            │
│                              │ Panel de Control │            │
│                              │  [Q][W][E][R][T] │            │
│                              │  [A][S][D][F][G] │            │
│                              │  [Z][X][C][V][B] │            │
│                              └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Puntos Clave de la Solución

### ❌ Problema Original
```javascript
// main.js (ANTES - no funcionaba)
setTimeout(() => {
    populateCivilizations();  // dataLoader no inicializado!
}, 100);
```

### ✅ Solución Implementada
```javascript
// main.js (DESPUÉS - funciona correctamente)
if (typeof dataLoader !== 'undefined') {
    await dataLoader.initialize();  // ← Inicialización correcta
    populateCivilizations();        // ← Ahora tiene datos
}
```

## 📊 Verificación en Consola

Cuando la aplicación cargue correctamente, deberías ver:

```
🚀 Inicializando DataLoader...
📁 Archivo cargado: assets/technologies/base_technologies.json
📁 Archivo cargado: assets/technologies/base_buildings.json
📁 Archivo cargado: assets/technologies/base_units.json
✅ Datos base cargados: { technologies: X, buildings: Y, units: Z }
📁 Archivo cargado: assets/civilization/mongols.json
📁 Archivo cargado: assets/civilization/sumeria.json
📁 Archivo cargado: assets/civilization/romans.json
📁 Archivo cargado: assets/civilization/vikings.json
📁 Archivo cargado: assets/civilization/argentinians.json
✅ 5 civilizaciones cargadas
✅ 5 civilizaciones cargadas (UI)
```

## 🎮 Flujo de Uso del Jugador

1. Usuario abre la aplicación
2. Ve pantalla de inicio con "Comenzar Juego"
3. Hace click en "Comenzar Juego"
4. Ve 7 opciones de tamaño de mapa
5. Selecciona un tamaño (ej: Normal - 120×120)
6. **AHORA VE 5 CIVILIZACIONES** ← ✅ SOLUCIONADO
7. Selecciona una civilización (ej: Sumeria)
8. El juego inicia con la configuración seleccionada

## 🔧 Archivos Involucrados

| Archivo | Responsabilidad | Cambios |
|---------|----------------|---------|
| `main.js` | Punto de entrada ES6 | ✅ Inicialización async del dataLoader |
| `dataLoader.js` | Carga de datos JSON | ✅ Ya existente, sin cambios |
| `index.html` | Estructura HTML | ✅ Sin cambios necesarios |
| `assets/civilization/*.json` | Datos de civilizaciones | ✅ Sin cambios |

## 🎯 Próximos Pasos

Después de esta corrección, el flujo completo debería funcionar:
1. ✅ Selección de tamaño de mapa
2. ✅ Selección de civilización (ahora funciona dinámicamente)
3. ✅ Inicio del juego con la configuración seleccionada
4. ✅ Game loop con renderizado y lógica
