# Especificación de Interacciones, UX y Accesibilidad (UI Core)

## 1. Atajos de Teclado Data-Driven (Hotkeys)
- **Definición en Data**: Toda unidad, edificio o tecnología especifica dinámicamente su tecla de atajo en la propiedad `hotkey` dentro de su respectivo archivo JSON (`unit-schema.json`, `building-schema.json`, `tech-schema.json`).
- **Insignia Visual (HotkeyBadge)**: El componente `ActionPanel` lee la propiedad `hotkey` de la data de la acción activa y la renderiza automáticamente en la esquina del botón.
- **Remapeo Dinámico**: El motor de entrada (*Input Manager*) permite a los usuarios redefinir las teclas globales manteniendo la vinculación dinámica a los comandos.

### Mapa Global de Atajos por Defecto (Resolución Dinámica)

| Tecla | Acción en UI / Motor | Contexto | Feedback Sonoro / Visual |
| :--- | :--- | :--- | :--- |
| `B` | Abrir / Cerrar Menú de Construcción | Unidad con `canBuild` / `canGather` seleccionada | Clic de UI + Grilla de construcción |
| `Espacio` / `H` | Centrar la cámara en la Base Principal | Edificio con `functional_tags: ["main_headquarters"]` | Desplazamiento inmediato de vista |
| `Tab` | Seleccionar la siguiente Unidad Inactiva | Unidad con `canGather` en estado `IDLE` | Destello de selección en unidad |
| `Shift + Tab` | Seleccionar la Unidad Inactiva anterior | Unidad con `canGather` en estado `IDLE` | Destello de selección en unidad |
| `F` | Ciclar entre las 7 Formaciones Tácticas | 2+ Unidades Seleccionadas | Sonido táctico + actualización de posiciones |
| `,` (Coma) | Seleccionar todas las unidades militares | Unidades con `attack_tags` o `attackType !== "none"` | Destello de selección masivo |
| `Doble Clic` | Seleccionar todas las unidades del mismo tipo en pantalla | En Entidad | Selección de grupo del mismo `id`/`type` |
| `Shift + Clic` | Añadir o quitar unidad a la selección actual | En Entidad | Inclusión o exclusión de selección |
| `Ctrl + [1-9]` | Guardar grupo de control de selección | Selección Activa | Sonido de grupo guardado |
| `[1-9]` | Seleccionar grupo de control guardado | Global | Enfoque de grupo |
| `Esc` | Cancelar selección / Cerrar modal / Volver | Global | Clic de cierre / Restauración de vista |

---

## 2. Estados Visuales y Micro-Interacciones (Estética Medieval Kingdom)

### Botones de Acción y Paneles del Reino
- **Default (Hierro Forjado & Madera)**: Fondo sólido de piedra/cuero oscuro `#221c2c`, borde de hierro tallado con bisel de bronce `2px solid #8c6239`, relieve interior `box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.15)`.
- **Hover (Resplandor Dorado Señorial)**: Escala ligera `transform: scale(1.04)`, borde de oro forjado `#ffd700`, resplandor reluciente `box-shadow: 0 0 16px rgba(255, 215, 0, 0.6)`. Transición `all 0.15s ease-out`.
- **Active / Pressed (Talla Hundida)**: Escala `transform: scale(0.96)`, fondo grabado hundido `box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.95)`, color de fondo `#16131c`.
- **Disabled (Piedra Inerte)**: Opacidad `0.45`, filtro tallado gris en relieve `filter: grayscale(100%)`, cursor `not-allowed`. Al hacer clic dispara alerta sonora de acción no permitida.
- **Selected / Active State (Estandarte Real)**: Borde continuo de oro esculpido `2px solid #ffd700`, resplandor interior con fondo carmesí o bronce noble.

---

## 3. Guía de Accesibilidad (A11y)

- **Foco por Teclado**: Todo botón o elemento interactivo debe poseer un anillo de foco visible `outline: 2px solid #f3e5ab; outline-offset: 2px`.
- **Trampa de Foco (Focus Trap)**: Al abrir modales de pantalla completa (ej. Árbol de Tecnologías), el foco queda restringido dentro del elemento modal mediante `FocusManager.trapFocus(modalElement)`.
- **Etiquetado ARIA**:
  - Paneles de HUD: `role="region"` y `aria-label="Nombre del Panel"`.
  - Contadores de recursos: `role="group"` y `aria-labelledby="resourceLabel resourceCount"`.
  - Modales: `role="dialog"` y `aria-modal="true"`.
  - Botones de cierre: `aria-label="Cerrar"`.

---

## 4. Requerimientos de Animación y Performance

- **Transiciones CSS**: Limitar animaciones a propiedades aceleradas por GPU (`transform`, `opacity`, `filter`).
- **Framerate UI**: Ninguna transición CSS o animación de micro-interacción debe bloquear el hilo principal (*Main Thread*) ni provocar descensos en el framerate del Canvas (mantenimiento de 60 FPS).
