# 🏛️ Sistema de Civilizaciones - Age Clone

## ✅ Archivos Creados

### 1. `civilizations.json`
Archivo de configuración con dos civilizaciones completas:

#### **Romanos** 🏛️
- **Especialidad:** Construcción y defensa
- **Bonificaciones:**
  - +25% velocidad de construcción
  - +30% HP en edificios
  - +10% ataque de infantería
  - +50 piedra inicial
- **Unidades únicas:**
  - Ciudadano Romano
  - Legionario (más HP y ataque)
  - Centurión (unidad especial)
- **Edificios renombrados:**
  - Foro Romano (Centro Urbano)
  - Domus (Casa)
  - Castra (Cuartel)

#### **Vikings** ⚔️
- **Especialidad:** Velocidad y ataque
- **Bonificaciones:**
  - +15% velocidad de unidades
  - +15% ataque de unidades
  - +10% velocidad de recolección
  - +50 madera y +50 comida inicial
- **Unidades únicas:**
  - Aldeano Vikingo (recolección mejorada)
  - Berserker (más rápido y letal)
  - Jarl (unidad especial)
- **Edificios renombrados:**
  - Gran Salón (Centro Urbano)
  - Cabaña Vikinga (Casa)
  - Campo de Guerra (Cuartel)

### 2. `civilizations.js`
Sistema de gestión de civilizaciones con:
- Carga asíncrona del JSON
- Aplicación de bonificaciones a unidades
- Aplicación de bonificaciones a edificios
- Cálculo de recursos iniciales
- Colores personalizados por civilización

## 📋 Cómo Integrar al Juego

### Paso 1: HTML ya está actualizado
El archivo `civilizations.js` ya está incluido en `index.html`:
```html
<script src="effects.js"></script>
<script src="civilizations.js"></script>
<script src="game.js"></script>
```

### Paso 2: Modificar `game.js`

#### 2.1 Cargar civilizaciones al inicio
En la función `window.addEventListener('DOMContentLoaded'` (línea ~1186):

```javascript
window.addEventListener('DOMContentLoaded', async () => {
    // Cargar civilizaciones primero
    await civilizationManager.loadCivilizations();
    
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    //... resto del código
});
```

#### 2.2 Agregar selección de civilización
Modificar la clase `Game` para aceptar una civilización:

```javascript
class Game {
    constructor(civilizationId = 'romans') {
        this.civilizationId = civilizationId;
        this.civilization = civilizationManager.getCivilization(civilizationId);
        
        // ... resto del constructor
        
        //  Agregar recursos iniciales de la civilización
        const bonusResources = civilizationManager.getStartingResources(civilizationId);
        this.resources.wood += bonusResources.wood;
        this.resources.food += bonusResources.food;
        this.resources.gold += bonusResources.gold;
        this.resources.stone += bonusResources.stone;
    }
}
```

#### 2.3 Aplicar bonificaciones a unidades
En cada lugar donde se crean unidades (Villager, Warrior, Archer), agregar:

```javascript
// Ejemplo en trainUnit (línea ~455)
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
    // APLICAR BONIFICACIONES DE CIVILIZACIÓN
    civilizationManager.applyUnitBonuses(unit, this.civilizationId);
    
    this.units.push(unit);
    this.entities.push(unit);
    // ... resto
}
```

#### 2.4 Aplicar bonificaciones a edificios
Similar a las unidades, en `placeBuilding` (línea ~395):

```javascript
if (building) {
    // APLICAR BONIFICACIONES DE CIVILIZACIÓN
    civilizationManager.applyBuildingBonuses(building, this.civilizationId);
    
    this.buildings.push(building);
    this.entities.push(building);
    // ... resto
}
```

#### 2.5 Usar colores personalizados
En la clase `Entity`, método `getTeamColor` (línea ~932):

```javascript
getTeamColor() {
    if (this.team === 'player' && game && game.civilizationId) {
        return civilizationManager.getTeamColor(game.civilizationId, this.team);
    }
    
    switch(this.team) {
        case 'player': return 'rgba(72, 187, 120, 0.3)';
        case 'enemy': return 'rgba(197, 48, 48, 0.3)';
        default: return 'rgba(160, 160, 160, 0.3)';
    }
}
```

## 🎨 Crear Pantalla de Selección (Opcional pero recomendado)

Añadir HTML para selección de civilización:

```html
<!-- Después de startScreen, antes de gameScreen -->
<div id="civSelectionScreen" class="civ-selection-screen hidden">
    <div class="civ-content">
        <h1>Selecciona tu Civilización</h1>
        <div id="civGrid" class="civ-grid"></div>
    </div>
</div>
```

Y el código JavaScript:

```javascript
function showCivSelection() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('civSelectionScreen').classList.remove('hidden');
    
    const civGrid = document.getElementById('civGrid');
    const civs = civilizationManager.getAllCivilizations();
    
    civGrid.innerHTML = '';
    civs.forEach(civ => {
        const civCard = document.createElement('div');
        civCard.className = 'civ-card';
        civCard.innerHTML = `
            <div class="civ-icon">${civ.icon}</div>
            <h3>${civ.name}</h3>
            <p>${civ.description}</p>
        `;
        civCard.onclick = () => startGameWithCiv(civ.id);
        civGrid.appendChild(civCard);
    });
}

function startGameWithCiv(civId) {
    document.getElementById('civSelectionScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    
    game = new Game(civId);
    requestAnimationFrame(gameLoop);
}
```

## 🚀 Resultado Final

Con este sistema, tendrás:
- ✅ Dos civilizaciones únicas con bonificaciones diferentes
- ✅ Unidades personalizadas por civilización
- ✅ Edificios renombrados según la civilización
- ✅ Colores temáticos
- ✅ Fácil de expandir añadiendo más civilizaciones al JSON

## 📝 Añadir Más Civilizaciones

Para añadir una nueva civilización, simplemente agrega un nuevo objeto en `civilizations.json`:

```json
"aztecs": {
  "id": "aztecs",
  "name": "Imperio Azteca",
  "icon": "🗿",
  "color": "#d97706",
  // ... bonuses, units, etc.
}
```

¡Y listo! El sistema lo cargará automáticamente.
