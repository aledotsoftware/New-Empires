# 🏭 Sistema de Cola de Producción - New Empires

**Última actualización**: 2026-01-11

---

## 📖 Descripción General

El sistema de cola de producción permite a los edificios productores (Centro Urbano, Cuartel) encolar múltiples unidades para entrenamiento secuencial.

---

## 🎯 Características

| Característica | Valor |
|----------------|-------|
| **Máximo en cola** | 5 unidades |
| **Recursos** | Se cobran al encolar |
| **Cancelación** | Devuelve 100% recursos |
| **Progreso** | Visible en UI |

---

## ⏱️ Tiempos de Entrenamiento

| Unidad | Tiempo | Costo |
|--------|--------|-------|
| Aldeano | 20 segundos | 50🌾 |
| Guerrero | 24 segundos | 60🌾 + 20💰 |
| Arquero | 28 segundos | 50🌾 + 25💰 |

---

## 🏗️ Edificios con Cola

### Centro Urbano (TownCenter)
- **Puede entrenar**: Aldeanos
- **Máximo cola**: 5
- **Rally Point**: Sí

### Cuartel (Barracks)
- **Puede entrenar**: Guerreros, Arqueros
- **Máximo cola**: 5
- **Rally Point**: Sí

---

## 🎮 Uso en el Juego

### Encolar Unidad
1. Seleccionar edificio productor
2. Presionar hotkey de unidad (Q para aldeano, Q/W para guerrero/arquero)
3. La unidad se añade a la cola
4. Notificación muestra posición en cola

### Ver Progreso
1. Seleccionar edificio con cola activa
2. En el panel de información aparece:
   - Icono de unidad en producción
   - Barra de progreso
   - Tiempo restante
   - Unidades adicionales en cola

### Cancelar Producción
- *(Funcionalidad futura: click derecho en cola)*

---

## 💻 API de ProductionQueue

### Ubicación
```
js/systems/ProductionQueue.js
```

### Constructor
```javascript
const queue = new ProductionQueue(building, maxSize = 5);
```

### Métodos Principales

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `enqueue(unitType, cost, time)` | Añade unidad a cola | boolean |
| `update(deltaTime)` | Procesa cola | Object|null |
| `getProgress()` | Progreso 0-1 | number |
| `getCurrentItem()` | Item actual | Object|null |
| `cancelLast()` | Cancela último | Object|null |
| `clear()` | Limpia toda la cola | Array |

### Ejemplo de Uso
```javascript
// En el juego
const building = game.selectedEntities[0];
if (building.productionQueue) {
    const success = building.queueUnit('villager', cost, 25);
    if (success) {
        console.log('Aldeano encolado');
    }
}
```

---

## 🔧 Integración con Game.js

### trainUnit()
```javascript
trainUnit(unitType, building) {
    // 1. Verificar cola disponible
    if (building.productionQueue?.isFull()) {
        return; // Cola llena
    }
    
    // 2. Cobrar recursos
    this.deductResources(cost);
    
    // 3. Encolar
    building.queueUnit(unitType, cost, trainingTime);
}
```

### update() - Procesamiento
```javascript
// En el game loop
for (const building of this.buildings) {
    if (building.productionQueue) {
        const completed = building.update(deltaTime, this);
        if (completed) {
            this._spawnUnit(completed.unitType, building);
        }
    }
}
```

---

## 📊 UI de Cola de Producción

### Panel de Información
Cuando un edificio con cola activa está seleccionado:

```
┌─────────────────────────────────────┐
│ 🏰 Centro Urbano                    │
│ HP: 2000/2000                       │
│ ─────────────────────────────────── │
│ 🔨 En producción:                   │
│ [👨‍🌾] Villager          15s         │
│ ████████████░░░░░░░░░░ 60%          │
│ +2 en cola                          │
└─────────────────────────────────────┘
```

---

## 🎯 Rally Point (Punto de Reunión)

Las unidades entrenadas se mueven automáticamente al Rally Point si está definido.

### Establecer Rally Point (Futuro)
```javascript
building.setRallyPoint(x, y);
```

---

**Ver también**: [UNIDADES_EDIFICIOS.md](UNIDADES_EDIFICIOS.md) | [HOTKEYS.md](HOTKEYS.md)
