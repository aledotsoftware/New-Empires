# Especificación de Reglas de Negocio: Núcleo del Juego (Game Core)

## Dominio
**Game Loop, Gestión de Estado, Cámara RTS, Niebla de Guerra, SpatialGrid y Persistencia**

## 1. Ciclo de Juego (Game Loop) & Renderizado
- **Frecuencia**: El bucle principal opera dinámicamente mediante `requestAnimationFrame`, calculando el delta de tiempo (`deltaTime`) en segundos para asegurar la independencia de framerate (apuntando a 60 FPS).
- **Culling de Renderizado por Viewport**: El motor de renderizado calcula la caja delimitadora de la cámara (*Camera Bounding Box*) y renderiza únicamente las celdas del terreno y entidades que se encuentren dentro de la vista visible más un margen de seguridad de 2 tiles.
- **Control de Pausa**: Cuando `isPaused` es verdadero, las actualizaciones de estado de entidades, temporizadores y movimientos se suspenden; el renderizado continúa activo para dibujar la interfaz y elementos estáticos.

## 2. Optimizaciones de Rendimiento Espacial (`SpatialGrid`)
- **Particionamiento Espacial**: El mapa de juego se subdivide en celdas cuadradas de 100px.
- **Búsquedas de Proximidad**: Las consultas de entidades cercanas (para colisiones, selección y rangos de ataque) intersecan únicamente las celdas vecinas de la grilla espacial, garantizando una complejidad de consulta de $O(1)$ a $O(k)$ donde $k$ es el número de entidades locales.

## 3. Mapa y Niebla de Guerra (Fog of War)
- **Tamaños de Mapa Admitidos**:
  - `tiny`: 120×120 tiles (3840×3840 px)
  - `small`: 144×144 tiles (4608×4608 px)
  - `medium`: 168×168 tiles (5376×5376 px)
  - `normal`: 200×200 tiles (6400×6400 px)
  - `large`: 220×220 tiles (7040×7040 px)
  - `giant`: 240×240 tiles (7680×7680 px)
  - `ludicrous`: 480×480 tiles (15360×15360 px)
- **TypedArrays & FOW Caching**:
  - Estado de celdas gestionado mediante `Uint8Array` nativo (`0: HIDDEN`, `1: EXPLORED`, `2: VISIBLE`).
  - Cacheado de geometrías de círculos de visión por radio para evitar cálculos trigonométricos o de raíz cuadrada por frame.
  - La visualización en el lienzo fuera de pantalla (*Offscreen Canvas*) utiliza `Uint32Array` para manipulación directa de píxeles a nivel de memoria.

## 4. Cámara RTS y Navegación
- **Desplazamiento**: WASD, teclas de dirección o al aproximar el cursor a los bordes de la pantalla (Edge Scrolling).
- **Centrado Rápido**: Presionar `Espacio` o `H` centra inmediatamente la cámara sobre el Centro Urbano propio.
- **Integración con Minimapa**: Al hacer clic en cualquier punto del minimapa, la vista de la cámara principal se traslada inmediatamente a las coordenadas de mundo correspondientes.

## 5. Persistencia y Estado de Partida (Save/Load)
- El estado serializado en `SaveManager` debe contener:
  - `version`: Identificador de versión del esquema.
  - `timestamp`: Marca de tiempo UNIX de guardado.
  - `civilizationId` & `enemyCivilizationId`: Identificadores de civilizaciones en partida.
  - `resources`: Cantidades actuales de Madera, Comida, Oro y Piedra.
  - `population` & `maxPopulation`: Población actual y capacidad máxima.
  - `entities`: Array serializado de unidades y edificios con sus coordenadas, vida (`hp`), estado e inventario.
  - `technologies`: Array de tecnologías investigadas.
  - `fogOfWar`: Cadena base64/array con el estado actual de la grilla FOW.
