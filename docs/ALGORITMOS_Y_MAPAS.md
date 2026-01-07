# Documentación de Algoritmos y Generación de Mapas

## 🗺️ Proceso de Generación del Mapa

El sistema de generación de mapas utiliza una combinación de algoritmos procedimentales para crear terrenos variados y equilibrados en cada partida.

### 1. Puntos Iniciales y Regiones de Voronoi
El generador comienza distribuyendo puntos aleatorios en el espacio. Utilizando diagramas de Voronoi, el mapa se divide en regiones poligonales alrededor de estos puntos. Cada región se clasifica posteriormente como tierra o agua (océanos, lagos), estableciendo la forma básica de los continentes y masas de agua.

### 2. Elevación y Biomas
Una vez definida la geografía básica, se calcula la elevación de cada punto de tierra basándose en su distancia al océano más cercano. La combinación de esta elevación con un factor de humedad determina el bioma de la región (bosque, desierto, nieve, pastizal, etc.), asegurando transiciones lógicas entre tipos de terreno.

### 3. Ríos y Características Geográficas
Se simulan ríos siguiendo las pendientes naturales creadas por el mapa de elevación, fluyendo desde las zonas altas hacia el mar. Adicionalmente, se esculpen características geográficas específicas como valles y cadenas montañosas para añadir variedad táctica y visual.

### 4. Distribución de Recursos y Vida
La distribución de recursos (oro, piedra, madera, comida) y fauna (ovejas, jabalíes, ciervos) se realiza de manera semi-aleatoria. El sistema sigue patrones predefinidos (templates) según el tipo de mapa seleccionado (por ejemplo, 'Arabia' tendrá recursos más dispersos que 'Arena'), garantizando que el mapa sea jugable y justo para todos los participantes.

### 5. Generación de Escenarios (RMS)
Para una personalización avanzada, el motor soporta un formato inspirado en *Random Map Scripting* (RMS). Esto permite definir reglas específicas para la generación del mapa, controlando la densidad de bosques, la cantidad de recursos iniciales y la posición de los jugadores, manteniendo siempre la topografía base característica del tipo de mapa elegido.

---

## 🧠 Algoritmos de Jugabilidad

### Búsqueda de Caminos (Pathfinding)
El movimiento de las unidades se gestiona mediante una variante optimizada del algoritmo **A* (A-star)**. Este algoritmo calcula la ruta más eficiente entre dos puntos en la cuadrícula del mapa, considerando:
- **Evitación de Obstáculos:** Navegación alrededor de árboles, edificios, agua y otras unidades.
- **Coste del Terreno:** Preferencia por terrenos más rápidos o seguros según el tipo de unidad.
- **Eficiencia:** Búsqueda rápida para manejar múltiples unidades moviéndose simultáneamente en tiempo real.
