# Component Specification: SelectionCard Component

## Component Name
`SelectionCard`

## Uic Location
Centro inferior del HUD (Panel de Selección).

---

## 1. Jerarquía del Componente

```
SelectionCard
├── SingleSelectionView (Visibilidad cuando hay 1 entidad seleccionada)
│   ├── EntityAvatar & Name
│   ├── HealthBarContainer (Barra de vida con texto HP actual / max)
│   ├── StatBadgeGroup (Ataque, Alcance, Armadura, Visión)
│   └── ProductionQueueList (si la entidad es un edificio de producción)
│       └── QueueSlot (hasta 5 elementos en cola con progreso %)
└── MultiSelectionView (Visibilidad cuando hay 2+ unidades seleccionadas)
    ├── MultiSelectionSummary ("12 Unidades Seleccionadas")
    └── EntityGridGroup
        └── UnitPortraitItem (Icono individual + mini barra de HP)
```

---

## 2. Props Esperadas

```typescript
interface SelectionCardProps {
  selectionType: 'single_unit' | 'single_building' | 'multiple_units' | 'resource_node' | null;
  entityDetails: {
    id: string;
    name: string;
    icon?: string; // Opcional: resuelve por convención assets/icons/{id}.png
    hp: number;
    maxHp: number;
    attackDamage?: number;
    attackRange?: number;
    armor?: number;
    productionQueue?: Array<{ unitType: string; progress: number; icon?: string }>;
  } | null;
  selectionGroup: Array<{
    id: string;
    type: string;
    icon?: string; // Opcional: resuelve por convención assets/icons/{type}.png
    hpRatio: number;
  }>;
  onPlaySound: (soundName: string) => void;
}
```

---

## 3. Estado Interno

- `selectedFilterType`: Filtro activo en selección múltiple para aislar solo un tipo de unidad (ej. aislar solo Arqueros dentro de un ejército).

---

## 4. Eventos Emitidos hacia el Engine / Core

- `onCancelQueueItem(index)`: Emite la cancelación del elemento en la posición `index` de la cola de producción del edificio activo y reembolsa el 100% de los recursos.
- `onFilterSelection(unitType)`: Emite al motor la restricción de la selección activa a únicamente las unidades del tipo seleccionado.
- `onSelectSingleFromGroup(entityId)`: Desselecciona el resto de unidades del grupo y enfoca la selección exclusivamente en la entidad indicada.
