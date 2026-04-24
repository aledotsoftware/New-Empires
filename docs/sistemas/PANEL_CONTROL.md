# 🎮 Sistema de Panel de Control - New Empires

**Última actualización**: 2026-01-10

---

## 📋 Descripción General

El Panel de Control es la interfaz principal para interactuar con unidades y edificios seleccionados. Está inspirado en el diseño de Age of Empires con una cuadrícula de botones y hotkeys.

---

## 🎯 Estructura del Panel

```
┌─────────────────────────────────────────────────┐
│  [Icono] Nombre de la Entidad                    │
│          HP: 50/50                               │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Q   │ │ W   │ │ E   │ │ R   │ │ T   │       │
│  │ 🏗️  │ │     │ │     │ │     │ │     │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ A   │ │ S   │ │ D   │ │ F   │ │ G   │       │
│  │     │ │     │ │     │ │     │ │     │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Z   │ │ X   │ │ C   │ │ V   │ │ B   │       │
│  │     │ │     │ │     │ │     │ │     │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## ⌨️ Mapa de Hotkeys

### Cuadrícula 3x5

```
Fila 1: Q  W  E  R  T
Fila 2: A  S  D  F  G
Fila 3: Z  X  C  V  B
```

### Acciones por Tipo de Entidad

#### 👨‍🌾 Aldeano (Villager)
| Tecla | Acción |
|-------|--------|
| Q | 🏗️ Abrir menú de construcción |

#### 🏰 Centro Urbano (Town Center)
| Tecla | Acción |
|-------|--------|
| Q | 👨‍🌾 Entrenar Aldeano (50🌾) |

#### ⚔️ Cuartel (Barracks)
| Tecla | Acción |
|-------|--------|
| Q | ⚔️ Entrenar Guerrero (60🌾 + 20💰) |
| W | 🏹 Entrenar Arquero (50🌾 + 25💰/🪵) |

---

## 🏗️ Menú de Construcción

Al presionar B (o Q con aldeano seleccionado):

```
┌─────────────────────────────────────┐
│        MENÚ DE CONSTRUCCIÓN         │
├─────────────────────────────────────┤
│                                     │
│  [H] 🏠 Casa        - 30🪵          │
│  [C] 🏰 Centro      - 275🪵 + 100🪨 │
│  [K] ⚔️ Cuartel     - 175🪵         │
│  [D] 📦 Depósito    - 100🪵         │
│  [L] 🌲 Dep.Madera  - 100🪵         │
│  [M] 🏪 Mercado     - 150🪵 + 50🪨  │
│  [T] ⛪ Templo      - 200🪵 + 100🪨 │
│  [W] 🔨 Taller      - 200🪵 + 50🪨  │
│                                     │
│  [ESC] Cancelar                     │
└─────────────────────────────────────┘
```

---

## 🎯 Estados de Botones

### Activo ✅
- Color normal
- Responde a click y hotkey
- Tiene acción asignada

### Deshabilitado ❌
- Color gris
- No responde a clicks
- **Causas**:
  - No hay suficientes recursos
  - Prerrequisitos no cumplidos
  - Límite de población alcanzado

### Vacío ⬜
- Posición sin acción asignada
- No muestra icono
- No responde a interacción

---

## 💻 Implementación Técnica

### Ubicación del Código

| Componente | Archivo | Método |
|------------|---------|--------|
| Renderizado del panel | `js/core/Game.js` | `updateActionsPanel()` |
| Hotkeys | `js/core/Game.js` | `handleKeyPress()` |
| Estilos | `medieval-theme.css` | - |
| HTML | `index.html` | `#commandPanel` |

### Estructura HTML

```html
<div class="bottom-hud">
    <div id="selectionPanel" class="premium-panel">
        <!-- Contenido de selección (icono, hp, etc) -->
    </div>

    <div id="commandPanel" class="premium-panel">
        <!-- Botones generados dinámicamente -->
    </div>
</div>
```

### Generación de Botones

```javascript
// Ejemplo simplificado
const buttons = [];

if (entity.type === 'villager') {
    buttons.push({
        icon: '🏗️',
        label: 'Construir',
        hotkey: 'Q',
        action: () => game.openBuildMenu(),
        enabled: true
    });
}

// Crear 15 botones (3x5)
for (let i = 0; i < 15; i++) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.setAttribute('data-hotkey', hotkeys[i]);
    
    if (i < buttons.length) {
        // Configurar botón con acción
    } else {
        // Botón vacío
        btn.classList.add('disabled');
    }
    
    grid.appendChild(btn);
}
```

### Manejo de Hotkeys

```javascript
handleKeyPress(e) {
    const key = e.key.toUpperCase();
    
    const hotkeyMap = {
        'Q': 0, 'W': 1, 'E': 2, 'R': 3, 'T': 4,
        'A': 5, 'S': 6, 'D': 7, 'F': 8, 'G': 9,
        'Z': 10, 'X': 11, 'C': 12, 'V': 13, 'B': 14
    };
    
    if (hotkeyMap.hasOwnProperty(key)) {
        const index = hotkeyMap[key];
        const buttons = document.querySelectorAll('.action-btn');
        
        if (buttons[index] && !buttons[index].classList.contains('disabled')) {
            buttons[index].click();
        }
    }
}
```

---

## 🎨 Estilos CSS

```css
.actions-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 5px;
}

.action-btn {
    width: 50px;
    height: 50px;
    position: relative;
    background: rgba(26, 26, 46, 0.8);
    border: 2px solid rgba(212, 175, 55, 0.5);
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover:not(.disabled) {
    transform: scale(1.05);
    border-color: var(--primary-gold);
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.action-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn::before {
    content: attr(data-hotkey);
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
}
```

---

## 🔧 Personalización

### Agregar Nueva Acción

1. En `updateActionsPanel()`, agregar al array de buttons:
```javascript
buttons.push({
    icon: '🆕',
    label: 'Nueva Acción',
    hotkey: hotkeys[buttons.length],
    cost: '100🌾',
    action: () => game.nuevaAccion(),
    enabled: this.canAfford({ food: 100 })
});
```

2. Implementar el método en `Game.js`:
```javascript
nuevaAccion() {
    // Lógica de la acción
}
```

### Cambiar Layout de Hotkeys

Modificar el array `hotkeys` para usar diferentes teclas:
```javascript
const hotkeys = [
    '1', '2', '3', '4', '5',  // Fila 1
    '6', '7', '8', '9', '0',  // Fila 2
    '-', '=', '[', ']', '\\'  // Fila 3
];
```

---

## 🐛 Debug del Panel

En la consola del navegador:

```javascript
// Verificar panel
console.log('Panel:', !!document.getElementById('commandPanel'));
console.log('Botones:', document.querySelectorAll('.action-btn').length);

// Ver entidad seleccionada
console.log('Seleccionada:', window.game?.selectedEntities?.[0]);

// Forzar actualización
window.game?.updateActionsPanel?.();
```

---

**Ver también**: [HOTKEYS.md](../sistemas/HOTKEYS.md) | [DESARROLLO.md](DESARROLLO.md)
