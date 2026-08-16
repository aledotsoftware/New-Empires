# Component Specification: TechTreeModal Component

## Component Name
`TechTreeModal`

## Uic Location
Pantalla completa / Modal flotante sobrepuesto sobre el juego.

---

## 1. Jerarquía del Componente

```
TechTreeModal
├── ModalHeader
│   ├── ModalTitle ("Árbol de Tecnologías")
│   └── CloseButton (Botón 'X' con trampa de foco)
└── TechTreeContentContainer (Contenedor con desplazamiento horizontal)
    └── AgeColumnList (30 Edades Históricas)
        ├── AgeHeader ("Edad de Bronce", etc.)
        └── TechNodeGroup (Nodos de la edad)
            └── TechNodeItem
                ├── TechIcon
                ├── TechName
                ├── StatusBadge (UNLOCKED | RESEARCHING | LOCKED)
                └── PrerequisiteLines (Líneas conectoras de dependencias)
```

---

## 2. Props Esperadas

```typescript
interface TechTreeModalProps {
  isOpen: boolean;
  activeCivilization: string;
  currentAgeLevel: number;
  researchedTechIds: Array<string>;
  researchingTechId: string | null;
  researchProgressRatio: number;
  playerResources: ResourceData;
  onCloseModal: () => void;
  onResearchTech: (techId: string) => void;
  onPlaySound: (soundName: string) => void;
}
```

---

## 3. Estado Interno

- `activeAgeFilter`: Edad seleccionada para centrar la vista en el desplazamiento horizontal.
- `hoveredTechNode`: Información detallada de costos y efectos del nodo sobre el cual se sitúa el cursor.

---

## 4. Eventos Emitidos hacia el Engine / Core

- `onCloseModal()`: Emite la orden de ocultar el modal, restablecer el foco con `FocusManager.restoreFocus()` y reanudar la simulación del juego si fue pausada automáticamente.
- `onResearchTech(techId)`: Emite al motor la solicitud de iniciar la investigación de la tecnología indicada desde el modal.
