# 📚 ARQUITECTURA DEL PROYECTO - REFERENCIA RÁPIDA\n\n**Última actualización**: 2026-01-10

### ✅ **Archivos ACTIVOS (ES6 Modular) - USAR ESTOS**

Estos son los archivos que **SÍ se están usando** en el juego:

#### **Archivo Principal**
- `main.js` - Punto de entrada, coordina todo, expone funciones globales

#### **Core (js/core/)**
- `Game.js` - **CLASE PRINCIPAL DEL JUEGO** ⭐
  - Constructor del juego
  - Métodos de UI (`updateSelectionPanel()`, `updateActionsPanel()`)
  - Manejo de entrada (`handleKeyPress()`, `handleRightClick()`)
  - Game loop y rendering
- `constants.js` - Constantes globales (CONFIG, TILE_SIZE, etc.)

#### **Entities (js/entities/)**
- `Entity.js` - Clase base
- `Building.js` - Clase base edificios
- `Unit.js` - Clase base unidades
- `units/Villager.js`, `units/Warrior.js`, `units/Archer.js`
- `buildings/TownCenter.js`, `buildings/House.js`, `buildings/Barracks.js`, etc.

#### **Managers (js/managers/)**
- `AssetLoader.js` - Carga de imágenes
- `SpatialGrid.js` - Optimización de búsquedas

#### **Map (js/map/)**
- `GridMap.js` - Sistema de cuadrícula para construcción
- `TerrainMap.js` - Sistema de terrenos

#### **Utils (js/utils/)**
- `DebugLogger.js` - Sistema de logging

### ❌ **Archivos LEGACY (NO Usar)**

Estos archivos **NO se están usando** actualmente:

- ❌ `game.js` (raíz) - Archivo monolítico antiguo, **IGNORAR**
  - Contiene código duplicado
  - NO se carga en el HTML
  - Solo existe para referencia histórica

### 🗂️ **Archivos Globales (Aún No Modularizados)**

Estos archivos se cargan como scripts globales (pendientes de modularizar):

- `dataLoader.js` - Carga datos de civilizaciones
- `technologies.js` - Sistema de tecnologías (TechManager)
- `mapGenerator.js` - Generador procedural de mapas
- `soundManager.js` - Sistema de sonidos
- `effects.js` - Efectos visuales

---

## 🎯 **Regla de Oro**

### **ANTES de editar CUALQUIER archivo JavaScript:**

1. **Verifica si está en `js/` (carpeta)**
   - ✅ **SÍ está en `js/`** → Archivo modular activo, EDITAR AQUÍ
   - ❌ **NO está en `js/`** → Verificar si es legacy

2. **Si el archivo está en la raíz:**
   - ✅ `main.js` → Activo, se puede editar
   - ✅ `dataLoader.js`, `technologies.js`, etc. → Activos (globales)
   - ❌ `game.js` → **LEGACY, NO EDITAR**

3. **Búsqueda rápida en `index.html`:**
   ```bash
   # Ver qué scripts se están cargando realmente
   grep "<script" index.html
   ```

---

## 📋 **Checklist para Modificaciones

**ANTES de agregar/modificar funcionalidad:**

- [ ] ¿El archivo está en `js/core/`, `js/entities/`, `js/managers/`, etc.?
- [ ] Si modifico `Game`, ¿estoy editando `js/core/Game.js` (correcto) o `game.js` (incorrecto)?
- [ ] ¿main.js necesita exponer esta función globalmente para el HTML?
- [ ] ¿Los imports están correctos en los archivos ES6?

**DESPUÉS de modificar:**

- [ ] Recarga con `Ctrl + F5` para verificar
- [ ] Verifica en consola que `window.game` existe
- [ ] Prueba la funcionalidad en el juego

---

## 🔧 **Flujo de Inicialización del Juego**

```
1. index.html carga
   ↓
2. main.js se ejecuta (ES6 module)
   ↓
3. main.js importa Game desde js/core/Game.js
   ↓
4. Usuario selecciona civilización
   ↓
5. startGame() en main.js crea: game = window.game = new Game()
   ↓
6. Game.js (modular) empieza a ejecutarse
   ↓
7. gameLoop() en main.js llama game.update() y game.render()
```

**NUNCA se ejecuta `game.js` de la raíz.**

---

## 💡 **Ejemplos Comunes**

### ❌ **INCORRECTO**
```javascript
// Editando game.js (raíz)
class Game {
    updateActionsPanel() {
        // Este código NUNCA se ejecutará
    }
}
```

### ✅ **CORRECTO**
```javascript
// Editando js/core/Game.js
export class Game {
    updateActionsPanel() {
        // Este código SÍ se ejecuta
    }
}
```

### ✅ **Exponer Función Globalmente**
```javascript
// En main.js
window.closeBuildMenu = function() {
    if (window.game) {
        window.game.closeBuildMenu();
    }
};
```

---

## 📝 **Para Futuras Modificaciones**

### **Panel de Control / UI**
- Archivo: `js/core/Game.js`
- Métodos: `updateSelectionPanel()`, `updateActionsPanel()`
- Hotkeys: `handleKeyPress()`

### **Construcción de Edificios**
- Archivo: `js/core/Game.js`
- Métodos: `openBuildMenu()`, `closeBuildMenu()`, `placeBuilding()`

### **Entrenar Unidades**
- Archivo: `js/core/Game.js`
- Método: `trainUnit()`

### **Movimiento/Cámara**
- Archivo: `js/core/Game.js`
- Métodos: `updateCamera()`, `handleRightClick()`

### **Funciones Globales (para HTML)**
- Archivo: `main.js`
- Exponer con `window.nombreFuncion = ...`

---

## 🚨 **Si el Juego NO Funciona**

1. **Verifica `window.game`:**
   ```javascript
   console.log('game existe:', !!window.game);
   console.log('es objeto:', typeof window.game);
   ```

2. **Si `window.game` es `null` o `undefined`:**
   - El juego no se ha iniciado aún
   - Hay un error en la inicialización
   - Revisa consola por errores

3. **¿Editaste el archivo correcto?**
   - ⚠️ Si editaste `game.js` (raíz), tus cambios NO se aplicarán
   - ✅ Edita `js/core/Game.js` en su lugar

---

## 📞 **Resumen Ultra Rápido**

| Tarea | Archivo Correcto |
|-------|------------------|
| Modificar clase Game | `js/core/Game.js` ✅ |
| Agregar función global | `main.js` ✅ |
| Panel de control | `js/core/Game.js` ✅ |
| Hotkeys | `js/core/Game.js` ✅ |
| **NO USAR NUNCA** | `game.js` (raíz) ❌ |

---

**Fecha de creación:** 2025-12-03  
**Última actualización:** 2025-12-03  
**Estado:** Arquitectura ES6 modular (76% completa)
