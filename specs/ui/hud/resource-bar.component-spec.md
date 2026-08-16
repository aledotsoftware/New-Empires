# Component Specification: ResourceBar Component

## Component Name
`ResourceBar`

## Uic Location
Parte superior de la pantalla de juego (`Top HUD Panel`).

---

## 1. Jerarquía del Componente

```
ResourceBar
├── ResourceItem (Wood)
│   ├── ResourceIcon
│   ├── ResourceValue
│   └── ResourceTooltip
├── ResourceItem (Food)
│   ├── ResourceIcon
│   ├── ResourceValue
│   └── ResourceTooltip
├── ResourceItem (Gold)
│   ├── ResourceIcon
│   ├── ResourceValue
│   └── ResourceTooltip
├── ResourceItem (Stone)
│   ├── ResourceIcon
│   ├── ResourceValue
│   └── ResourceTooltip
├── PopulationItem
│   ├── PopulationIcon
│   └── PopulationValue ("current / max")
└── GameTimer & SettingsButton
```

---

## 2. Props Esperadas

```typescript
interface ResourceBarProps {
  resources: {
    wood: number;
    food: number;
    gold: number;
    stone: number;
  };
  population: {
    current: number;
    max: number;
    limit: number;
  };
  gameTimeSeconds: number;
  onOpenSettings: () => void;
  onPlaySound: (soundName: string) => void;
}
```

---

## 3. Estado Interno

- `activeTooltip`: Identificador del recurso sobre el cual el usuario tiene posado el cursor (`wood` | `food` | `gold` | `stone` | `null`).
- `popAlertActive`: Booleano `true` cuando `population.current >= population.max` para activar la animación de pulso rojo y alerta **sonora y visual**.

---

## 4. Eventos Emitidos hacia el Engine / Core

- `onOpenSettings()`: Notifica al controlador del juego para pausar la simulación y desplegar el menú de opciones.
- `onResourceClick(resourceType)`: Notifica la selección del recurso para resaltar aldeanos trabajando en él.
- `onPlaySound(soundName)`: Solicita al motor de audio reproducir el sonido especificado.
