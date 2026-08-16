# Component Specification: Minimap Component

## Component Name
`Minimap`

## Uic Location
Esquina inferior derecha del HUD.

---

## 1. Jerarquía del Componente

```
Minimap
├── MinimapCanvas (Canvas 2D para la vista comprimida del mapa)
├── ViewportRectOverlay (Rectángulo que representa la vista actual de la cámara)
├── SignalPingContainer (Superposición de alertas de combate/pings)
└── MinimapControls
    ├── ToggleTerrainModeButton
    └── CenterHomeButton
```

---

## 2. Props Esperadas

```typescript
interface MinimapProps {
  mapSize: {
    width: number;
    height: number;
  };
  cameraPosition: {
    x: number;
    y: number;
    viewportWidth: number;
    viewportHeight: number;
  };
  entitiesDots: Array<{
    x: number;
    y: number;
    team: 'player' | 'enemy' | 'neutral';
    type: 'unit' | 'building' | 'resource';
  }>;
  fogOfWarBuffer: Uint8Array | null;
  onPlaySound?: (soundName: string) => void;
}
```

---

## 3. Estado Interno

- `isDraggingCamera`: Booleano `true` mientras el usuario mantiene presionado el botón izquierdo del ratón sobre el minimapa para arrastrar la cámara en tiempo real.
- `pingList`: Array de eventos de alerta activos en el minimapa (ej. ataques o señales de aliados) con temporizadores de expiración de 3 segundos y efecto sonoro asociado.

---

## 4. Eventos Emitidos hacia el Engine / Core

- `onCameraMove(targetWorldX, targetWorldY)`: Emite las nuevas coordenadas de mundo a las cuales se debe trasladar la cámara principal del motor.
- `onMinimapPing(worldX, worldY)`: Emite una señal de atención en las coordenadas indicadas para difusión en multijugador o alerta visual.
