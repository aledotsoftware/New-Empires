# 🏰 Age Clone - Juego de Estrategia en Tiempo Real

Un clon inspirado en Age of Empires desarrollado completamente con HTML5, CSS3 y JavaScript vanilla.

## 📋 Descripción

Age Clone es un juego de estrategia en tiempo real (RTS) que captura la esencia de Age of Empires, permitiendo a los jugadores:
- Recolectar recursos (madera, comida, oro, piedra)
- Construir edificios (Centro Urbano, Casas, Cuarteles, Minas)
- Entrenar unidades (Aldeanos, Guerreros, Arqueros)
- Combatir contra enemigos
- Gestionar una economía básica

## 🎯 Alcances del Proyecto

### ✅ Funcionalidades Implementadas

#### Sistema de Recursos
- **4 tipos de recursos**: Madera, Comida, Oro y Piedra
- **Recolección automática**: Los aldeanos recolectan recursos automáticamente
- **Límite de población**: Sistema de casas para aumentar el límite poblacional
- **UI de recursos**: Panel superior mostrando recursos actuales

#### Sistema de Construcción
- **Centro Urbano (Town Center)**: Edificio principal, entrena aldeanos
- **Casa (House)**: Aumenta el límite de población (+5)
- **Cuartel (Barracks)**: Entrena unidades militares
- **Depósito de Recursos**: Para almacenar recursos recolectados

#### Sistema de Unidades
- **Aldeanos (Villagers)**: 
  - Recolectan recursos
  - Pueden construir edificios
  - Movimiento básico con pathfinding
- **Guerreros (Warriors)**: 
  - Unidades militares de corto alcance
  - Ataque cuerpo a cuerpo
- **Arqueros (Archers)**:
  - Unidades militares de largo alcance
  - Ataque a distancia

#### Sistema de Combate
- **Detección de enemigos**: Las unidades detectan enemigos cercanos
- **Combate automático**: Ataque automático cuando detectan enemigos
- **Sistema de HP**: Puntos de vida para todas las unidades
- **Muerte de unidades**: Las unidades mueren al llegar a 0 HP

#### Mecánicas de Juego
- **Selección de unidades**: Click para seleccionar, shift-click para selección múltiple
- **Movimiento**: Click derecho para mover unidades seleccionadas
- **Construcción**: Menú de construcción para aldeanos
- **Entrenamiento**: Menú de entrenamiento en edificios
- **Niebla de guerra básica**: Visibilidad limitada del mapa

#### Interfaz de Usuario
- **Panel de recursos**: Muestra madera, comida, oro, piedra y población
- **Panel de selección**: Muestra información de la unidad/edificio seleccionado
- **Menús contextuales**: Construcción y entrenamiento
- **Minimapa**: Vista general del campo de batalla
- **Mensajes de juego**: Notificaciones importantes

## 🚫 Límites del Proyecto

### Funcionalidades NO Implementadas

#### Limitaciones Técnicas
- **Sin multijugador**: Solo modo un jugador contra IA básica
- **Sin guardado/carga**: No se persiste el progreso
- **Sin sonido**: No hay efectos de sonido ni música
- **IA básica**: La IA enemiga tiene comportamiento muy simple
- **Sin servidor**: Todo ejecuta en el cliente

#### Limitaciones de Gameplay
- **Una sola civilización**: No hay diferentes civilizaciones con bonificaciones únicas
- **Sin edades/épocas**: No hay sistema de avance tecnológico
- **Sin tecnologías**: No hay árbol de mejoras/investigaciones
- **Sin murallas/defensas**: No hay estructuras defensivas avanzadas
- **Mapa fijo**: Un solo tipo de mapa generado proceduralmente
- **Sin formaciones**: Las unidades no mantienen formaciones
- **Pathfinding básico**: Navegación simple sin algoritmos avanzados (A*)

#### Limitaciones de Contenido
- **Pocas unidades**: Solo 3 tipos de unidades
- **Pocos edificios**: 4-5 tipos de edificios
- **Sin unidades navales**: No hay barcos ni agua navegable
- **Sin máquinas de asedio**: No hay catapultas, arietes, etc.
- **Sin héroes**: No hay unidades especiales o héroes

#### Limitaciones Visuales
- **Gráficos 2D simples**: Sprites básicos y formas geométricas
- **Sin animaciones complejas**: Animaciones muy básicas
- **Sin partículas**: Efectos visuales mínimos
- **Sin zoom**: Nivel de zoom fijo

## 📦 Requerimientos

### Requerimientos del Sistema

#### Navegador Web
- **Chrome**: Versión 90+ (Recomendado)
- **Firefox**: Versión 88+
- **Edge**: Versión 90+
- **Safari**: Versión 14+

#### Hardware Mínimo
- **Procesador**: Dual-core 2.0 GHz o superior
- **RAM**: 2 GB mínimo
- **GPU**: Soporte para Canvas HTML5
- **Resolución**: Mínimo 1280x720

### Requerimientos de Desarrollo

#### Conocimientos Necesarios
- HTML5 (Canvas API)
- CSS3 (Flexbox, Grid, Animaciones)
- JavaScript ES6+ (Clases, Módulos, Async/Await)
- Programación Orientada a Objetos
- Fundamentos de Game Loops y Delta Time
- Matemáticas básicas (vectores, colisiones)

#### Herramientas de Desarrollo
- Editor de código (VS Code, Sublime, etc.)
- Servidor HTTP local (Live Server, Python SimpleHTTPServer, etc.)
- DevTools del navegador (para debugging)
- Git (opcional, para control de versiones)

## 🚀 Instalación y Uso

### Instalación

1. **Clonar o descargar** este repositorio
2. **No se requieren dependencias** - Es JavaScript vanilla

### Ejecución

#### Opción 1: Live Server (Recomendado)
```bash
# Si tienes VS Code con la extensión Live Server
# Click derecho en index.html > "Open with Live Server"
```

#### Opción 2: Python
```bash
# Python 3
python -m http.server 8000

# Luego abre en el navegador: http://localhost:8000
```

#### Opción 3: Node.js
```bash
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar
http-server

# Luego abre en el navegador: http://localhost:8080
```

#### Opción 4: Abrir directamente
- **Nota**: Algunos navegadores tienen restricciones CORS
- Doble click en `index.html` (puede no funcionar en todos los casos)

## 🎮 Controles del Juego

### Controles de Ratón
- **Click Izquierdo**: Seleccionar unidad/edificio
- **Shift + Click Izquierdo**: Añadir a selección múltiple
- **Click Derecho**: Mover unidades seleccionadas / Atacar enemigo
- **Arrastrar**: Selección de área (box selection)

### Controles de Teclado
- **B**: Abrir menú de construcción (con aldeano seleccionado)
- **H**: Construir Casa
- **C**: Construir Centro Urbano
- **K**: Construir Cuartel
- **ESC**: Cancelar acción / Cerrar menú
- **Espacio**: Centrar en Centro Urbano
- **Delete**: Eliminar unidad seleccionada (cheat)

### Menús
- Los edificios muestran menús de entrenamiento al seleccionarlos
- Los aldeanos pueden acceder al menú de construcción

## 📁 Estructura del Proyecto

```
age-clone/
├── index.html              # Punto de entrada HTML
├── styles.css              # Estilos globales y UI
├── js/
│   ├── main.js            # Inicialización y game loop principal
│   ├── game.js            # Clase principal del juego
│   ├── entities/
│   │   ├── Entity.js      # Clase base para todas las entidades
│   │   ├── Unit.js        # Clase base para unidades
│   │   ├── Building.js    # Clase base para edificios
│   │   ├── Villager.js    # Aldeano
│   │   ├── Warrior.js     # Guerrero
│   │   └── Archer.js      # Arquero
│   ├── managers/
│   │   ├── ResourceManager.js    # Gestión de recursos
│   │   ├── SelectionManager.js   # Gestión de selección
│   │   └── UIManager.js          # Gestión de interfaz
│   ├── map/
│   │   └── Map.js         # Generación y renderizado del mapa
│   └── utils/
│       ├── Vector.js      # Clase para vectores 2D
│       └── helpers.js     # Funciones auxiliares
├── assets/                # (Opcional) Imágenes y sprites
└── README.md             # Este archivo
```

## 🎨 Características Técnicas

### Renderizado
- **Canvas HTML5**: Renderizado 2D usando Canvas API
- **60 FPS**: Game loop optimizado con requestAnimationFrame
- **Delta Time**: Movimiento independiente del framerate
- **Culling**: Solo renderiza entidades visibles en pantalla

### Arquitectura
- **Orientado a Objetos**: Uso de clases ES6
- **Entity Component System (simplificado)**: Entidades base con herencia
- **Event-driven**: Sistema de eventos para interacciones
- **Managers**: Separación de responsabilidades

### Optimizaciones
- **Spatial Partitioning básico**: Para detección de colisiones
- **Object Pooling**: Reutilización de objetos (proyectiles)
- **Lazy Evaluation**: Cálculos solo cuando son necesarios

## 🔧 Personalización

### Modificar Valores del Juego
Edita las constantes en `js/game.js`:
```javascript
const GAME_CONFIG = {
  STARTING_WOOD: 200,
  STARTING_FOOD: 200,
  STARTING_GOLD: 100,
  STARTING_STONE: 100,
  // ... más configuraciones
};
```

### Añadir Nuevas Unidades
1. Crea una nueva clase que extienda `Unit`
2. Define sus atributos (HP, velocidad, daño, costo)
3. Añade al menú de entrenamiento
4. Implementa su lógica de comportamiento

### Añadir Nuevos Edificios
1. Crea una nueva clase que extienda `Building`
2. Define sus atributos (HP, costo, tamaño)
3. Añade al menú de construcción
4. Implementa su funcionalidad

## 📝 Roadmap Futuro (Posibles Mejoras)

- [ ] Sistema de edades/épocas
- [ ] Árbol de tecnologías
- [ ] Más tipos de unidades y edificios
- [ ] Pathfinding A*
- [ ] IA mejorada
- [ ] Múltiples mapas
- [ ] Efectos de sonido y música
- [ ] Partículas y efectos visuales
- [ ] Sistema de guardado/carga
- [ ] Multijugador (WebSocket)

## 🐛 Problemas Conocidos

- El pathfinding puede hacer que las unidades se atasquen
- La IA enemiga es muy básica
- No hay balance de unidades
- Performance puede degradarse con muchas unidades (>100)

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Proyecto educativo creado para aprender desarrollo de juegos web.

## 🙏 Agradecimientos

Inspirado por Age of Empires (Ensemble Studios / Microsoft)

---

**¡Disfruta jugando y modificando el juego!** 🎮🏰
