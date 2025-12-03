# 🏰 New Empires - Juego de Estrategia en Tiempo Real

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

Un juego de estrategia en tiempo real (RTS) completo inspirado en Age of Empires, desarrollado completamente con HTML5, CSS3 y JavaScript vanilla. Construye tu civilización, recolecta recursos, investiga tecnologías y conquista a tus enemigos en una experiencia de juego rica y profunda.

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Demo Visual](#-demo-visual)
- [Sistemas del Juego](#-sistemas-del-juego)
- [Instalación](#-instalación)
- [Controles](#-controles)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Documentación](#-documentación)
- [Tecnologías](#-tecnologías)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características Principales

### 🎮 Gameplay Completo
- **Sistema de Recursos**: 4 tipos de recursos (madera, comida, oro, piedra)
- **Construcción**: 8+ tipos de edificios con funciones únicas
- **Unidades**: 3 tipos de unidades (aldeanos, guerreros, arqueros)
- **Combate**: Sistema de combate automático con IA
- **Civilizaciones**: Sistema de civilizaciones con bonificaciones únicas
- **Tecnologías**: Árbol tecnológico con 30 edades históricas
- **Terrenos**: 6 tipos de terreno con efectos tácticos

### 🗺️ Mapas Dinámicos
- **7 tamaños de mapa**: Desde Tiny (1280x720) hasta Ludicrous (5120x2880)
- **Generación procedural**: Cada partida es única
- **Biomas variados**: Pastizales, bosques, agua, montañas, colinas y desiertos
- **Sistema de grid**: Construcción precisa con snap-to-grid

### 🏛️ Civilizaciones Únicas
Cada civilización tiene bonificaciones, unidades únicas y estilo de juego distintivo:
- **Sumeria** 🌾: Especialistas en agricultura y economía temprana
- **Egipto** 🏜️: Maestros de la construcción y monumentos
- **Roma** 🏛️: Imperio de construcción y defensa (+25% velocidad construcción, +30% HP edificios)
- **Vikings** ⚔️: Guerreros veloces y letales (+15% velocidad/ataque unidades)
- Y más...

### 📜 Árbol de Tecnologías Histórico
- **30 edades** desde el Paleolítico (13.000 a.C.) hasta la Era Moderna (2000 d.C.)
- **7 categorías**: Herramientas, Agricultura, Economía, Arquitectura, Militar, Defensa, Cultura
- **Progresión realista**: Prerequisitos y costos balanceados
- **Interfaz visual**: Timeline histórico con filtros por era

### 🎨 Interfaz Moderna
- **Diseño premium**: Colores vibrantes, glassmorphism, animaciones suaves
- **UI responsiva**: Panel de recursos, minimapa, control de unidades
- **Configuración en juego**: Ajustes de sonido, visualización y cámara
- **Notificaciones**: Sistema de mensajes para eventos importantes

---

## 🎮 Demo Visual

### Pantalla de Inicio
<p align="center">
  <em>Interfaz de inicio con selección de civilización y tamaño de mapa</em>
</p>

### Gameplay
<p align="center">
  <em>Vista del juego con UI completa, minimapa y panel de control</em>
</p>

---

## 🎯 Sistemas del Juego

### Sistema de Recursos

#### Tipos de Recursos
| Recurso | Icono | Obtención | Uso Principal |
|---------|-------|-----------|---------------|
| Madera  | 🪵 | Bosques | Construcción de edificios |
| Comida  | 🌾 | Granjas, Caza | Entrenamiento de unidades |
| Oro     | 💰 | Minas de oro | Tecnologías y comercio |
| Piedra  | 🪨 | Canteras | Edificios avanzados |

#### Configuración Inicial
```javascript
Recursos iniciales (base):
- Madera: 200
- Comida: 200
- Oro: 100
- Piedra: 100
- Población: 3/5
```

### Sistema de Construcción

#### Edificios Disponibles

**Económicos**
- **Centro Urbano** 🏰 - Entrena aldeanos, punto de recolección (Costo: 275🪵 + 100🪨)
- **Casa** 🏠 - +5 población (Costo: 30🪵)
- **Depósito** 📦 - Almacena recursos (Costo: 100🪵)
- **Depósito de Madera** 🌲 - Almacenamiento especializado (Costo: 100🪵)
- **Mercado** 🏪 - Comercio de recursos (Costo: 150🪵 + 50🪨)

**Militares**
- **Cuartel** ⚔️ - Entrena unidades militares (Costo: 175🪵)

**Culturales**
- **Templo** ⛪ - Investigación de tecnologías (Costo: 200🪵 + 100🪨)
- **Taller** 🔨 - Mejoras de unidades (Costo: 200🪵 + 50🪨)

### Sistema de Unidades

#### Estadísticas de Unidades

| Unidad | HP | Ataque | Velocidad | Rango | Costo | Tiempo |
|--------|----|---------| ---------|-------|-------|--------|
| Aldeano | 40 | - | 60 px/s | - | 50🌾 | 25s |
| Guerrero | 100 | 10 | 70 px/s | Melee | 60🌾 + 20💰 | 30s |
| Arquero | 60 | 8 | 75 px/s | 100px | 50🌾 + 25🪵 | 35s |

### Sistema de Terrenos

#### Tipos de Terreno y Efectos

| Terreno | Color | Construible | Velocidad | Bonos de Combate | Recursos |
|---------|-------|-------------|-----------|------------------|----------|
| Pastizal 🌾 | Verde claro | ✅ | 100% | Caballería +15% ataque | Comida |
| Bosque 🌲 | Verde oscuro | ❌ | 70% | Arqueros +10% defensa | Madera |
| Agua 💧 | Azul | ❌ | 0% | - | Pesca |
| Montaña ⛰️ | Marrón oscuro | ❌ | 0% | - | Piedra |
| Colina 🏔️ | Marrón claro | ✅ | 60% | Arqueros +20% alcance, +15% defensa | Piedra |
| Desierto 🏜️ | Amarillo | ✅ | 85% | - | Oro |

### Árbol de Tecnologías

#### Estructura de Edades

**Prehistoria** (Edades 1-15: 13.000-6.000 a.C.)
- Herramientas de piedra, domesticación, agricultura, cerámica, escritura

**Edad del Bronce** (Edades 16-23: 5.500-2.000 a.C.)
- Metalurgia, comercio marítimo, sistemas de riego, grandes imperios

**Edad del Hierro** (Edades 24-25: 2.000-500 a.C.)
- Trabajo del hierro, forja avanzada, armas duraderas

**Edad Clásica** (Edades 26-27: 500 a.C.-500 d.C.)
- Filosofía, arquitectura monumental, fundición avanzada

**Edad Media** (Edades 28-29: 500-1500 d.C.)
- Feudalismo, caballería, castillos, gremios

**Era Moderna** (Edad 30: 1500-2000 d.C.)
- Pólvora, imprenta, navegación oceánica, banca

#### Tecnologías Destacadas
- **Edad 1**: Talla de Sílex
- **Edad 6**: Agricultura
- **Edad 12**: La Rueda
- **Edad 15**: Escritura
- **Edad 16**: Trabajo del Bronce
- **Edad 24**: Trabajo del Hierro
- **Edad 27**: Arquitectura Clásica
- **Edad 30**: Pólvora, Imprenta

---

## 🚀 Instalación

### Prerrequisitos

- Navegador web moderno (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Servidor HTTP local (obligatorio - no funciona con `file://`)

### Método 1: VS Code Live Server (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/New-Empires.git
cd New-Empires

# 2. Abrir con VS Code
code .

# 3. Instalar extensión "Live Server"
# 4. Click derecho en index.html > "Open with Live Server"
```

### Método 2: Python HTTP Server

```bash
# Python 3
python -m http.server 8000

# Abrir en navegador: http://localhost:8000
```

### Método 3: Node.js http-server

```bash
# Instalar http-server
npm install -g http-server

# Ejecutar
http-server

# Abrir en navegador: http://localhost:8080
```

### Verificación de Instalación

1. Abrir consola del navegador (F12)
2. Verificar que no hay errores
3. Debería ver: "Juego iniciado correctamente"
4. Assets cargados correctamente

---

## 🎮 Controles

### Controles de Ratón

| Acción | Control |
|--------|---------|
| Seleccionar unidad/edificio | Click Izquierdo |
| Selección múltiple | Shift + Click Izquierdo |
| Mover unidades | Click Derecho |
| Atacar enemigo | Click Derecho sobre enemigo |
| Selección de área | Arrastrar con Click Izquierdo |
| Navegar minimapa | Click en minimapa |

### Controles de Teclado

| Tecla | Acción |
|-------|--------|
| **B** | Abrir menú de construcción |
| **H** | Construir Casa |
| **C** | Construir Centro Urbano |
| **K** | Construir Cuartel |
| **Espacio** | Centrar en Centro Urbano |
| **Tab** | Seleccionar próximo aldeano inactivo |
| **ESC** | Cancelar acción / Cerrar menú |
| **Delete** | Eliminar unidad (debug) |
| **WASD** | Mover cámara |
| **Flechas** | Mover cámara |

### Controles de Cámara

- **Mover ratón al borde**: Desplazamiento automático de cámara
- **Configuración**: Velocidad y margen ajustables en el menú de configuración

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
New-Empires/
├── index.html                  # Punto de entrada HTML
├── main.js                     # Punto de entrada JavaScript (ES6)
│
├── js/                         # Módulos ES6
│   ├── core/
│   │   ├── constants.js        # Configuración global del juego
│   │   └── Game.js             # Clase principal del juego (1324 líneas)
│   │
│   ├── entities/
│   │   ├── Entity.js           # Clase base para entidades
│   │   ├── Unit.js             # Clase base para unidades móviles
│   │   ├── Building.js         # Clase base para edificios
│   │   ├── units/
│   │   │   ├── Villager.js     # Aldeano (recolección y construcción)
│   │   │   ├── Warrior.js      # Guerrero (combate melee)
│   │   │   └── Archer.js       # Arquero (combate a distancia)
│   │   └── buildings/
│   │       ├── TownCenter.js   # Centro Urbano
│   │       ├── House.js        # Casa
│   │       ├── Barracks.js     # Cuartel
│   │       ├── Storage.js      # Depósito
│   │       ├── Market.js       # Mercado
│   │       ├── Temple.js       # Templo
│   │       └── Workshop.js     # Taller
│   │
│   ├── map/
│   │   ├── GridMap.js          # Sistema de grid para construcción
│   │   └── TerrainMap.js       # Generación de terrenos
│   │
│   ├── managers/
│   │   ├── AssetLoader.js      # Carga de imágenes y assets
│   │   └── SpatialGrid.js      # Optimización de búsquedas espaciales
│   │
│   └── utils/
│       └── DebugLogger.js      # Sistema centralizado de logging
│
├── assets/                     # Recursos del juego
│   ├── icons/                  # Iconos de unidades y edificios (PNG)
│   ├── sound/                  # Efectos de sonido (WAV)
│   └── civilization/           # Datos de civilizaciones (JSON)
│
├── styles.css                  # Estilos principales
├── styles-patch.css            # Correcciones de estilos
├── tech-tree-styles.css        # Estilos del árbol de tecnologías
│
├── debugLogger.js              # Sistema de debug (legacy)
├── effects.js                  # Efectos visuales (legacy)
├── dataLoader.js               # Carga de datos JSON (legacy)
├── technologies.js             # Sistema de tecnologías (legacy)
├── mapGenerator.js             # Generación de mapas (legacy)
├── soundManager.js             # Gestión de audio (legacy)
├── game.js                     # Código original (backup)
│
└── docs/                       # Documentación
    ├── CODE_INDEX.md           # Índice completo del código
    ├── CIVILIZATIONS_README.md # Sistema de civilizaciones
    ├── TECH_TREE_README.md     # Árbol de tecnologías
    ├── TERRAIN_SYSTEM.md       # Sistema de terrenos
    ├── MODULARIZATION_PLAN.md  # Plan de modularización
    └── COMPLETE_SUMMARY.md     # Resumen de modularización
```

### Arquitectura Técnica

#### Patrón de Diseño
- **Orientado a Objetos**: Clases ES6 con herencia
- **Entity Component System (simplificado)**: Entidades base con herencia
- **Event-driven**: Sistema de eventos para interacciones
- **Managers**: Separación de responsabilidades

#### Flujo de Inicialización

```
1. Carga de HTML (index.html)
2. Carga de estilos (con cache busting)
3. Carga de scripts:
   ├── debugLogger.js
   ├── effects.js
   ├── dataLoader.js
   ├── technologies.js
   ├── mapGenerator.js
   ├── soundManager.js
   └── main.js (ES6 module)
4. DOMContentLoaded:
   ├── Inicializar debugLogger
   ├── Cargar civilizaciones
   ├── Cargar assets
   ├── Cargar sonidos
   └── Renderizar pantalla de inicio
5. Selección de mapa y civilización
6. Inicio del juego:
   ├── Crear instancia de Game
   ├── Generar mapa
   ├── Crear entidades iniciales
   └── Iniciar game loop
```

#### Game Loop

```javascript
requestAnimationFrame(gameLoop)
  ├── Calcular deltaTime
  ├── game.update(deltaTime)
  │   ├── Actualizar entidades
  │   ├── Procesar IA
  │   ├── Detectar colisiones
  │   └── Aplicar física
  ├── game.render()
  │   ├── Dibujar terreno
  │   ├── Dibujar grid (opcional)
  │   ├── Dibujar entidades
  │   ├── Dibujar UI
  │   └── Renderizar minimapa
  └── requestAnimationFrame(gameLoop)
```

### Características Técnicas

#### Renderizado
- **Canvas HTML5**: Renderizado 2D usando Canvas API
- **60 FPS**: Game loop optimizado con `requestAnimationFrame`
- **Delta Time**: Movimiento independiente del framerate
- **Culling**: Solo renderiza entidades visibles en pantalla
- **Layered Rendering**: Terreno → Grid → Entidades → UI

#### Optimizaciones
- **Spatial Partitioning**: Grid espacial para detección eficiente de entidades
- **Object Pooling**: Reutilización de objetos (proyectiles, efectos)
- **Lazy Evaluation**: Cálculos solo cuando son necesarios
- **Asset Caching**: Precarga de imágenes y sonidos
- **Cache Busting**: Timestamps para evitar caché durante desarrollo

#### Modularización
- **18 módulos ES6**: ~3,200 líneas de código organizado
- **76% modularizado**: Core completo, entidades y managers
- **Exports/Imports explícitos**: Dependencias claras
- **Sin código duplicado**: Reutilización máxima

---

## 📚 Documentación

### Documentación Completa

El proyecto incluye documentación exhaustiva en la carpeta `docs/`:

- **[CODE_INDEX.md](CODE_INDEX.md)** - Mapa completo de ubicación de código y funcionalidades
- **[CIVILIZATIONS_README.md](CIVILIZATIONS_README.md)** - Sistema de civilizaciones y bonificaciones
- **[TECH_TREE_README.md](TECH_TREE_README.md)** - Árbol de tecnologías histórico completo
- **[TERRAIN_SYSTEM.md](TERRAIN_SYSTEM.md)** - Sistema de terrenos y efectos tácticos
- **[COMPLETE_SUMMARY.md](COMPLETE_SUMMARY.md)** - Resumen de modularización (76% completado)

### Guías Rápidas

#### ¿Dónde está...?

**Sistema de recursos**
- Constantes → `js/core/constants.js` (`CONFIG.GATHER_RATES`)
- Recolección → `js/entities/units/Villager.js`
- Nodos → `Game.resourceNodes` array

**Sistema de construcción**
- Modo construcción → `Game.buildMode`, `Game.buildGhost`
- Validación → `GridMap.isAreaFree()`, `TerrainMap.canBuildAt()`
- Costos → `js/core/constants.js` (`CONFIG.COSTS`)

**Sistema de combate**
- Detección → `Unit.findNearbyEnemy()`
- Ataque → `Unit.tryAttack()`
- Stats → Clases de unidades individuales

**Cámara**
- Movimiento → `Game.updateCamera()`
- Configuración → `Game.cameraConfig`

---

## 🛠️ Tecnologías

### Core

- **HTML5**: Estructura semántica y Canvas API
- **CSS3**: Flexbox, Grid, Animaciones, Variables CSS, Glassmorphism
- **JavaScript ES6+**: Clases, Módulos, Async/Await, Arrow Functions

### APIs Utilizadas

- **Canvas API**: Renderizado 2D de alta performance
- **Web Audio API**: Efectos de sonido y música
- **Local Storage**: Configuración persistente (futuro)
- **RequestAnimationFrame**: Game loop optimizado

### Librerías

- **Ninguna** - 100% JavaScript Vanilla
- Esto demuestra las capacidades completas del JavaScript moderno sin dependencias externas

### Fuentes

- **Google Fonts**:
  - Cinzel (Display, títulos)
  - Inter (UI, texto)

---

## 🔧 Personalización

### Modificar Valores del Juego

Edita las constantes en `js/core/constants.js`:

```javascript
export const CONFIG = {
  STARTING_WOOD: 200,
  STARTING_FOOD: 200,
  STARTING_GOLD: 100,
  STARTING_STONE: 100,
  GATHER_RATES: {
    wood: 1,
    food: 1,
    gold: 0.5,
    stone: 0.5
  },
  // ... más configuraciones
};
```

### Añadir Nuevas Unidades

1. Crea una nueva clase en `js/entities/units/`:

```javascript
import { Unit } from '../Unit.js';

export class Cavalry extends Unit {
  constructor(x, y, team = 'player') {
    super(x, y, team);
    this.type = 'cavalry';
    this.maxHp = 120;
    this.hp = 120;
    this.attack = 12;
    this.speed = 90;
    this.attackSpeed = 1.0;
    this.attackRange = 5;
    this.icon = 'cavalry';
    this.loadIcon();
  }
}
```

2. Importa en `main.js` y `Game.js`
3. Añade al menú de entrenamiento en `index.html`
4. Añade ícono en `assets/icons/cavalry.png`

### Añadir Nuevos Edificios

Similar al proceso de unidades:

1. Crea clase en `js/entities/buildings/`
2. Hereda de `Building`
3. Define propiedades (HP, costo, tamaño)
4. Añade al menú de construcción

### Añadir Nueva Civilización

Edita `assets/civilization/nueva-civilizacion.json`:

```json
{
  "id": "aztecs",
  "name": "Imperio Azteca",
  "icon": "🗿",
  "color": "#d97706",
  "description": "Guerreros temibles...",
  "bonuses": {
    "gatherRate": {
      "food": 1.15
    },
    "unitStats": {
      "attack": 1.10
    }
  },
  "startingResources": {
    "wood": 0,
    "food": 50,
    "gold": 0,
    "stone": 0
  }
}
```

---

## 🗺️ Roadmap

### En Desarrollo (v1.1)
- [ ] Persistencia de partida (guardado/carga)
- [ ] Mejoras de IA enemiga
- [ ] Más civilizaciones (Grecia, China, Persia)
- [ ] Tutorial interactivo

### Planeado (v1.2)
- [ ] Sistema de farmeo automático
- [ ] Formaciones de unidades
- [ ] Unidades navales
- [ ] Máquinas de asedio (catapultas, arietes)

### Futuro (v2.0)
- [ ] Multijugador (WebSocket/WebRTC)
- [ ] Editor de mapas
- [ ] Campaña histórica
- [ ] Logros y estadísticas

### Mejoras Técnicas
- [ ] Pathfinding A* completo
- [ ] Modularización al 100% (5 scripts legacy restantes)
- [ ] WebWorkers para IA
- [ ] WebGL para renderizado
- [ ] Service Worker para offline play

---

## 🐛 Problemas Conocidos

### Performance
- Con más de 100 unidades, puede haber degradación de FPS
- Solución planeada: Optimización con WebWorkers

### Pathfinding
- Las unidades pueden atascarse en esquinas
- Solución planeada: Implementar A* completo

### Balance
- Algunas unidades no están balanceadas
- Solución: Sistema de balance por civilización

### Compatibilidad
- No funciona con protocolo `file://` (requiere servidor HTTP)
- Safari puede tener issues con ES6 modules

---

## 🤝 Contribución

Las contribuciones son bienvenidas! Sigue estos pasos:

### Proceso de Contribución

1. **Fork** el repositorio
2. **Crea** una rama con tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: amazing feature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### Guías de Contribución

#### Código
- Usa ES6+ features
- Mantén la arquitectura modular
- Comenta código complejo
- Sigue las convenciones de nombres existentes

#### Commits
- Formato: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Ejemplo: `feat: add cavalry unit`

#### Testing
- Prueba en múltiples navegadores
- Verifica que no hay errores en consola
- Comprueba que no se rompe funcionalidad existente

### Áreas que Necesitan Ayuda

- 🎨 **Arte**: Sprites y assets mejorados
- 🔊 **Audio**: Más efectos de sonido y música
- 🤖 **IA**: Mejorar comportamiento enemigo
- 🗺️ **Mapas**: Más generadores procedurales
- 📚 **Documentación**: Tutoriales y guías
- 🌍 **Traducciones**: Internacionalización

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 New Empires Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 👥 Equipo y Créditos

### Desarrollo
- **Arquitectura**: Sistema modular ES6
- **Game Design**: Inspirado en Age of Empires
- **Optimización**: Spatial Grid, Object Pooling

### Inspiración
- **Age of Empires** (Ensemble Studios / Microsoft)
- **Starcraft** (Blizzard Entertainment)
- **Command & Conquer** (Westwood Studios)

### Tecnologías
- **Canvas API**: Renderizado 2D
- **ES6 Modules**: Arquitectura modular
- **CSS3 Custom Properties**: Theming dinámico

---

## 📞 Contacto y Soporte

### Reportar Bugs
Usa el [Issue Tracker](https://github.com/tu-usuario/New-Empires/issues) de GitHub

### Preguntas Frecuentes

**P: ¿Por qué no funciona al abrir directamente el archivo?**
R: Los ES6 modules requieren un servidor HTTP por razones de seguridad (CORS).

**P: ¿Puedo usar esto para un proyecto comercial?**
R: Sí, la licencia MIT lo permite. Solo mantén el aviso de copyright.

**P: ¿Habrá multijugador?**
R: Está en el roadmap para v2.0 usando WebSockets.

**P: ¿Cómo contribuyo con nuevas civilizaciones?**
R: Añade un archivo JSON en `assets/civilization/` siguiendo el formato existente.

---

## 🎓 Recursos de Aprendizaje

Este proyecto es excelente para aprender:

- **Game Development**: Loop de juego, física, colisiones
- **Canvas API**: Renderizado 2D, optimización
- **JavaScript Avanzado**: Clases, herencia, módulos
- **Arquitectura de Software**: Modularización, separación de responsabilidades
- **Algoritmos**: Spatial partitioning, pathfinding
- **UI/UX Design**: Interfaces de juego, feedback visual

### Tutoriales Relacionados
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [JavaScript.info](https://javascript.info/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

---

## 🌟 Agradecimientos Especiales

Gracias a todos los que contribuyen y apoyan este proyecto!

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

---

**¡Construye tu imperio y conquista el mundo!** 🏰⚔️🌍

---

<div align="center">

**[⬆ Volver arriba](#-new-empires---juego-de-estrategia-en-tiempo-real)**

Hecho con ❤️ y ☕ | [GitHub](https://github.com/tu-usuario/New-Empires)

</div>
