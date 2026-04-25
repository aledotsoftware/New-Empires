# 💾 Sistema de Guardado - New Empires

**Última actualización**: 2026-01-11

---

## 📖 Descripción General

El sistema de guardado permite persistir el estado del juego en localStorage o exportarlo como archivo JSON.

---

## 🎯 Características

| Función | Descripción |
|---------|-------------|
| **Guardar** | Almacena en localStorage |
| **Cargar** | Recupera partida guardada |
| **Exportar** | Descarga archivo JSON |
| **Importar** | Carga desde archivo |

---

## 🎮 Uso en el Juego

### Acceder al Menú de Guardado
1. Presionar **ESC** o click en **⚙️ Configuración**
2. En la sección **💾 Partida** encontrarás:
   - 💾 **Guardar Partida**
   - 📂 **Cargar Partida**
   - 📤 **Exportar a Archivo**

### Guardar Partida
1. Click en **"💾 Guardar Partida"**
2. Aparece confirmación: "✅ Partida guardada correctamente"
3. El estado se almacena en localStorage

### Ver Información de Guardado
1. Click en **"📂 Cargar Partida"**
2. Muestra: civilización, fecha, unidades, edificios

### Exportar a Archivo
1. Click en **"📤 Exportar a Archivo"**
2. Se descarga `newempires_save_[timestamp].json`
3. Útil para backups o compartir partidas

---

## 📦 Datos Guardados

### Estado del Juego
```javascript
{
  version: "1.0",
  timestamp: 1736565600000,
  civilizationId: "mongols",
  gameTime: 125000,
  
  // Recursos
  resources: {
    wood: 500,
    food: 350,
    gold: 200,
    stone: 100
  },
  population: 8,
  maxPopulation: 20,
  
  // Cámara
  camera: { x: 1200, y: 800 },
  
  // Mapa
  mapConfig: {
    width: 100,
    height: 100,
    seed: 12345
  }
}
```

### Entidades Serializadas
```javascript
{
  units: [
    {
      type: "villager",
      x: 500,
      y: 400,
      hp: 50,
      maxHp: 50,
      team: "player",
      state: "IDLE",
      carryAmount: 5,
      carryType: "wood"
    }
  ],
  buildings: [
    {
      type: "townCenter",
      x: 600,
      y: 500,
      hp: 2000,
      maxHp: 2000,
      team: "player",
      isUnderConstruction: false
    }
  ],
  enemies: [...],
  resourceNodes: [...]
}
```

---

## 💻 API de SaveManager

### Ubicación
```
js/managers/SaveManager.js
```

### Singleton Global
```javascript
import { saveManager } from './js/managers/SaveManager.js';

// También disponible como:
window.saveManager
```

### Métodos Principales

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `save(game)` | Guarda estado | boolean |
| `load()` | Carga estado | Object|null |
| `hasSave()` | Verifica si hay guardado | boolean |
| `deleteSave()` | Elimina guardado | void |
| `getSaveInfo()` | Obtiene metadatos | Object|null |
| `exportToFile(game)` | Exporta JSON | void |
| `importFromFile(file)` | Importa JSON | Promise<Object> |

### Propiedad

| Propiedad | Descripción | Valor |
|-----------|-------------|-------|
| `SAVE_KEY` | Clave localStorage | 'newempires_save' |
| `VERSION` | Versión de formato | '1.0' |

---

## 🔧 Ejemplos de Uso

### Guardar Partida
```javascript
if (saveManager.save(game)) {
    console.log('Guardado exitoso');
}
```

### Verificar y Cargar
```javascript
if (saveManager.hasSave()) {
    const state = saveManager.load();
    console.log(`Civilización: ${state.civilizationId}`);
}
```

### Obtener Info sin Cargar
```javascript
const info = saveManager.getSaveInfo();
if (info) {
    console.log(`Última partida: ${new Date(info.timestamp)}`);
    console.log(`Población: ${info.population}`);
}
```

### Exportar a Archivo
```javascript
saveManager.exportToFile(game);
// Se descarga: newempires_save_1736565600000.json
```

### Importar desde Archivo
```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = async (e) => {
    const file = e.target.files[0];
    const state = await saveManager.importFromFile(file);
    console.log('Partida importada:', state);
};
input.click();
```

---

## ⚙️ Funciones Globales (main.js)

### window.saveGame()
```javascript
// Guarda la partida actual
saveGame();
```

### window.loadGame()
```javascript
// Muestra información del guardado
// (Carga completa en desarrollo)
loadGame();
```

### window.exportGameToFile()
```javascript
// Exporta a archivo JSON
exportGameToFile();
```

---

## 📊 Estructura del Archivo Exportado

```json
{
  "version": "1.0",
  "timestamp": 1736565600000,
  "civilizationId": "mongols",
  "gameTime": 125000,
  "resources": {
    "wood": 500,
    "food": 350,
    "gold": 200,
    "stone": 100
  },
  "population": 8,
  "maxPopulation": 20,
  "camera": { "x": 1200, "y": 800 },
  "mapConfig": {
    "width": 100,
    "height": 100
  },
  "units": [...],
  "buildings": [...],
  "enemies": [...],
  "resourceNodes": [...],
  "researchedTechs": []
}
```

---

## 🔮 Futuras Mejoras

- [x] Carga completa de partida guardada
- [ ] Múltiples slots de guardado
- [ ] Guardado automático (cada 5 min)
- [ ] Preview de guardado con minimapa
- [ ] Sincronización con la nube

---

## ⚠️ Limitaciones Actuales

1. **Carga completa** implementada.
2. **Un solo slot** de guardado en localStorage
3. **Sin compresión** - archivos pueden ser grandes
4. **Versión fija** - sin migración entre versiones

---

**Ver también**: [HOTKEYS.md](HOTKEYS.md) | [TROUBLESHOOTING.md](../guias/TROUBLESHOOTING.md)
