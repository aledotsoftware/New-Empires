# Component Specification: ActionPanel Component

## Component Name
`ActionPanel`

## Uic Location
Esquina inferior izquierda del HUD.

---

## 1. Jerarquía del Componente

```
ActionPanel
├── ActionGrid (Grilla 3x4 de botones de mando)
│   └── ActionButton (12 ranuras)
│       ├── ActionIcon
│       ├── HotkeyBadge
│       ├── CostOverlay (si aplica)
│       └── ProgressSpinner (para investigaciones activas)
├── BuildSubMenuContainer (Visibilidad condicional al abrir menú de construcción 'B')
└── FormationSubMenuContainer (Visibilidad condicional con 2+ unidades seleccionadas)
```

---

## 2. Props Esperadas

```typescript
interface ActionPanelProps {
  selectedEntity: EntityData | null;
  playerResources: ResourceData;
  activeBuildingMode: boolean;
  availableActions: Array<{
    id: string;
    label: string;
    icon?: string; // Opcional: resuelve por convención assets/icons/{id}.png
    hotkey: string;
    cost?: ResourceCost;
    enabled: boolean;
    disabledReason?: string;
  }>;
  onPlaySound: (soundName: string) => void;
}
```

---

## 3. Estado Interno

- `activeSubmenu`: Submenú desplegado (`main` | `build_economic` | `build_military` | `formations`).
- `hoveredAction`: Acción sobre la cual se sitúa el puntero para desplegar el tooltip de costo e información.

---

## 4. Eventos Emitidos hacia el Engine / Core

- `onExecuteAction(actionId)`: Notifica la activación de una orden (ej. `train_warrior`, `research_iron_working`, `toggle_formation`). Dispara sonido `ui_click` o alerta de error si `enabled === false`.
- `onOpenBuildMenu()`: Emite la señal para abrir la grilla de edificios disponibles para un aldeano.
- `onSelectBuildingToPlace(buildingType)`: Emite al motor el tipo de edificio seleccionado para activar la vista previa flotante en la grilla del mapa.
