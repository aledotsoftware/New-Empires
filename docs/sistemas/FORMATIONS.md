# 🎖️ Sistema de Formaciones - New Empires

**Última actualización**: 2026-01-11

---

## 📖 Descripción General

El sistema de formaciones permite organizar grupos de unidades en patrones predefinidos para movimiento y combate táctico.

---

## 🎯 Formaciones Disponibles

| Formación | Símbolo | Descripción | Uso Ideal |
|-----------|---------|-------------|-----------|
| **Line** | ── | Línea horizontal | Avance amplio |
| **Column** | │ | Columna vertical | Pasillos, emboscadas |
| **Box** | ▢ | Cuadrado/caja | Defensa general |
| **Wedge** | 🔺 | Cuña de ataque | Cargar al enemigo |
| **Vee** | ∧ | V invertida | Defensa de flanco |
| **Circle** | ○ | Círculo | Defender un punto |
| **Spread** | ⊕ | Dispersa | Evitar ataques de área |

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| **F** | Ciclar a la siguiente formación |

### Requisitos
- Mínimo **2 unidades** seleccionadas
- Solo afecta a **unidades** (no edificios)

---

## 📐 Visualización de Formaciones

### Line (Línea)
```
●─●─●─●─●
```
Unidades alineadas horizontalmente con espaciado uniforme.

### Column (Columna)
```
●
│
●
│
●
```
Unidades alineadas verticalmente.

### Box (Caja)
```
● ● ●
● ● ●
● ● ●
```
Cuadrado basado en raíz cuadrada del número de unidades.

### Wedge (Cuña)
```
    ●
   ● ●
  ● ● ●
```
Punta al frente, se expande hacia atrás. Ideal para cargar.

### Vee (V)
```
●       ●
  ●   ●
    ●
```
V invertida, protege los flancos.

### Circle (Círculo)
```
  ● ●
●     ●
●     ●
  ● ●
```
Unidades distribuidas en círculo alrededor del centro.

### Spread (Dispersa)
```
  ●   ●
●       ●
    ●
●     ●
```
Distribución irregular para evitar ataques de área.

---

## 💻 API de FormationManager

### Ubicación
```
js/systems/FormationManager.js
```

### Singleton Global
```javascript
import { formationManager, FORMATIONS } from './js/systems/FormationManager.js';
```

### Métodos Principales

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `getPositions(type, units, center, spacing)` | Calcula posiciones | Array<{x,y}> |
| `applyFormation(type, units, center, spacing)` | Aplica formación | void |
| `cycleFormation()` | Cambia a siguiente | string |
| `getAvailableFormations()` | Lista formaciones | string[] |

### Propiedades

| Propiedad | Descripción | Default |
|-----------|-------------|---------|
| `currentFormation` | Formación actual | 'box' |
| `spacing` | Espacio entre unidades | 40px |

---

## 🔧 Ejemplos de Uso

### Aplicar Formación Específica
```javascript
const units = game.selectedEntities.filter(e => e.isUnit);
const center = { x: 500, y: 400 };

formationManager.applyFormation('wedge', units, center);
```

### Ciclar Formaciones
```javascript
// En handleKeyPress
if (e.key === 'f') {
    const formation = formationManager.cycleFormation();
    game.showNotification(`Formación: ${formation}`);
}
```

### Obtener Posiciones
```javascript
const positions = FORMATIONS.circle(units, center, 60);
// Retorna: [{x: 500, y: 340}, {x: 560, y: 400}, ...]
```

---

## 🎯 Estrategias de Uso

### Organización Automática
El sistema de formaciones posiciona automáticamente las unidades según su rol y durabilidad para maximizar su efectividad en combate:
1. **Caballería (`cavalry`)**: Prioridad 1. Se ubica siempre al frente o en los extremos para liderar cargas o flanquear.
2. **Infantería (`warrior`, `spearman`)**: Prioridad 2. Protege el frente, formando un muro sólido para absorber el daño directo.
3. **A distancia (`archer`)**: Prioridad 3. Se posiciona detrás de la línea de infantería para disparar con seguridad.
4. **Civiles (`villager`)**: Prioridad 4. Se ubica en la retaguardia para máxima protección.

### Ataque
1. **Wedge** para cargar contra formaciones enemigas
2. **Line** para maximizar unidades en combate simultáneo

### Defensa
1. **Circle** para defender un punto (recurso, edificio)
2. **Vee** para proteger flancos
3. **Box** para defensa general

### Movimiento
1. **Column** para pasar por pasillos estrechos
2. **Spread** para evitar trampas de área

### Contra Splash Damage
1. **Spread** dispersa unidades para minimizar daño de área
2. Aumentar `spacing` manualmente para más dispersión

---

## 📊 Parámetros Configurables

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `spacing` | 40px | Distancia base entre unidades |
| `radius` (circle) | 60px | Radio del círculo |
| `spread` | 80px | Dispersión máxima |

*Nota: El `spacing` base escala dinámicamente con la cantidad de unidades (`spacing * (1.25 + (unidades / 50))`) para prevenir aglomeraciones que rompan el pathfinding en ejércitos grandes.*

### Ejemplo con Spacing Custom
```javascript
formationManager.applyFormation('line', units, center, 60); // 60px de espacio base
```

---

## 🔮 Futuras Mejoras

- [ ] Hotkey para formación específica (Ctrl+F1-F7)
- [ ] Formaciones guardadas
- [ ] Formaciones personalizadas
- [ ] Orientación de formación (rotar hacia enemigo)
- [ ] Preview visual antes de aplicar

---

**Ver también**: [HOTKEYS.md](HOTKEYS.md) | [UNIDADES_EDIFICIOS.md](UNIDADES_EDIFICIOS.md)
