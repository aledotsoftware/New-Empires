# 🏰 New Empires - Juego de Estrategia en Tiempo Real

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

Un juego de estrategia en tiempo real (RTS) completo inspirado en Age of Empires, desarrollado completamente con HTML5, CSS3 y JavaScript vanilla.

**Construye tu civilización, recolecta recursos, investiga tecnologías y conquista a tus enemigos.**

---

## ✨ Características Principales

### 🎮 Gameplay Completo
- **4 tipos de recursos**: Madera, Comida, Oro, Piedra
- **8+ edificios**: Centro Urbano, Casa, Cuartel, Depósitos, Mercado, Templo, Taller
- **3 tipos de unidades**: Aldeanos, Guerreros, Arqueros
- **Sistema de combate** con IA automática
- **12 civilizaciones** con bonificaciones únicas

### 🗺️ Mapas Dinámicos
- **7 tamaños de mapa**: Desde Tiny (50×50) hasta Ludicrous (255×255)
- **Generación procedural**: Cada partida es única
- **6 tipos de terreno**: Pastizales, Bosques, Agua, Montañas, Colinas, Desiertos

### 📜 Árbol de Tecnologías
- **30 edades históricas**: Desde el Paleolítico hasta la Era Moderna
- **7 categorías**: Herramientas, Agricultura, Economía, Arquitectura, Militar, Defensa, Cultura

### 🏛️ Civilizaciones
- **Mongols** 🐎 - Caballería veloz
- **Sumeria** 🌾 - Economía temprana
- **Romans** 🏛️ - Construcción y defensa
- **Vikings** ⚔️ - Guerreros veloces
- **+8 más**: Argentinians, Babylon, Byzantium, Caliphate, Egypt, Greece, Persia, Spain

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Servidor HTTP local (obligatorio - no funciona con `file://`)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/New-Empires.git
cd New-Empires

# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server

# Opción 3: VS Code Live Server
# Click derecho en index.html > "Open with Live Server"
```

Luego abrir: `http://localhost:8000`

> 📖 Ver [Guía de Instalación Completa](docs/guias/INSTALACION.md)

---

## 🎮 Controles

### Ratón
| Acción | Control |
|--------|---------|
| Seleccionar | Click Izquierdo |
| Selección múltiple | Shift + Click / Arrastrar |
| Mover/Atacar | Click Derecho |
| Navegar minimapa | Click en minimapa |

### Teclado
| Tecla | Acción |
|-------|--------|
| **B** | Menú de construcción |
| **Espacio** | Centrar en Centro Urbano |
| **Tab** | Siguiente aldeano inactivo |
| **ESC** | Cancelar acción |
| **WASD / Flechas** | Mover cámara |
| **F** | Ciclar formación (2+ unidades) |
| **Ctrl+1-9** | Guardar grupo de control |
| **1-9** | Seleccionar grupo guardado |
| **Q-B** | Hotkeys de acciones |

---

## 🏗️ Arquitectura

El proyecto utiliza una **arquitectura modular ES6** con ~3,200 líneas de código organizadas en 19 módulos.

```
New-Empires/
├── main.js                 # Punto de entrada ES6
├── js/
│   ├── core/               # Game, constants
│   ├── entities/           # Unidades y edificios
│   ├── managers/           # AssetLoader, SpatialGrid
│   ├── map/                # GridMap, TerrainMap
│   └── utils/              # DebugLogger
├── assets/                 # Imágenes, sonidos, JSON
└── docs/                   # Documentación
```

> 📖 Ver [Documentación de Arquitectura](docs/arquitectura/ARQUITECTURA.md)

---

## 📚 Documentación

Toda la documentación está organizada en la carpeta `docs/`:

| Sección | Descripción |
|---------|-------------|
| [📁 Índice](docs/INDEX.md) | Punto de entrada a toda la documentación |
| [🏗️ Arquitectura](docs/arquitectura/) | Estructura del código y modularización |
| [⚙️ Sistemas](docs/sistemas/) | Tecnologías, terrenos, civilizaciones |
| [📖 Guías](docs/guias/) | Instalación, desarrollo, contribución |
| [📜 Historial](docs/historial/) | Changelog y fixes |

---

## 🗺️ Roadmap

### Completado (v1.1) ✅
- [x] Sistema de guardado/carga de partida
- [x] Cola de producción para edificios
- [x] Sistema de formaciones (7 tipos)
- [x] Grupos de control (Ctrl+1-9)

### En Desarrollo (v1.2)
- [ ] Mejoras de IA enemiga
- [ ] Más civilizaciones
- [ ] Tutorial interactivo

### Futuro (v2.0)
- [ ] Multijugador (WebSocket)
- [ ] Editor de mapas
- [ ] Campaña histórica

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/MiFeature`)
3. Commit tus cambios (`git commit -m 'feat: add feature'`)
4. Push a la rama (`git push origin feature/MiFeature`)
5. Abre un Pull Request

> 📖 Ver [Guía de Contribución](docs/guias/CONTRIBUCION.md)

---

## 🛠️ Tecnologías

- **HTML5 Canvas** - Renderizado 2D
- **JavaScript ES6+** - Lógica del juego (módulos)
- **CSS3** - Estilos con variables y glassmorphism
- **Sin dependencias externas** - 100% Vanilla JS

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Créditos

### Inspiración
- Age of Empires (Ensemble Studios)
- Starcraft (Blizzard)
- Command & Conquer (Westwood)

---

<div align="center">

**¡Construye tu imperio y conquista el mundo!** 🏰⚔️🌍

[📖 Documentación](docs/INDEX.md) · [🐛 Reportar Bug](https://github.com/tu-usuario/New-Empires/issues) · [✨ Solicitar Feature](https://github.com/tu-usuario/New-Empires/issues)

</div>



🏰 Reporte de Estado Técnico: New Empires
1. Resumen Ejecutivo
New Empires es un motor de juego de estrategia en tiempo real (RTS) inspirado en clásicos como Age of Empires. Está desarrollado íntegramente con tecnologías web modernas utilizando un enfoque "Vanilla" (sin dependencias externas), lo que garantiza un rendimiento ligero y una alta compatibilidad.

Versión Actual: v1.1+.
Estado: Funcional y jugable, con sistemas de núcleo (core) maduros y optimizados.
Tecnologías: HTML5 Canvas (Renderizado 2D), JavaScript ES6 (Módulos), CSS3 (Modern UI).
2. Arquitectura del Sistema
El proyecto sigue un diseño modular y orientado a objetos, organizado para facilitar el escalado y la mantenibilidad.

🧱 Componentes Core (/js/core)
Game.js: Es la orquesta principal. Gestiona el bucle de juego, la cámara RTS, la selección de unidades y la integración de todos los subsistemas (Rendering, Input, Física).
Optimización "Bolt": Se han implementado optimizaciones críticas como el uso de Uint32Array para la manipulación de píxeles en la Niebla de Guerra (FOW) y buffers de canvas fuera de pantalla para terrenos y minimapas.
🗺️ Sistema de Mapas (/js/map)
Generación Procedural: Utiliza un sistema basado en semillas (seed) para crear mapas únicos con diversos biomas (pastizales, desiertos, bosques).
Grillas Espaciales (SpatialGrid): Implementa particionamiento espacial para optimizar la búsqueda de colisiones y selección, evitando iterar sobre miles de entidades cada frame.
👥 Entidades y Unidades (/js/entities)
Gestión de IA: Las unidades poseen estados definidos (recolección, combate, patrulla) con lógica de búsqueda de caminos (pathfinding).
Civilizaciones: 12 civilizaciones con bonificaciones específicas (ej. Sumeria: mejor economía; Mongoles: caballería veloz).
3. Funcionalidades Implementadas
Sistema	Estado	Detalles Técnicos
Economía	✅ Completo	4 recursos (Madera, Comida, Oro, Piedra), recolección y entrega en depósitos.
Combate	✅ Completo	IA automática de ataque, tipos de daño y alcances diferenciados (Warriors vs Archers).
Tecnología	✅ Completo	Árbol de 30 edades con 7 categorías de investigación.
Persistencia	✅ Completo	Sistema de Guardado/Carga (LocalStorage y descarga de archivos JSON).
UX/UI	✅ Avanzado	Formaciones de unidades (7 tipos), grupos de control (Ctrl+1-9) y cursor contextual.
4. Análisis de Rendimiento (Optimización)
Se observa un esfuerzo significativo en mantener el juego fluido incluso en mapas de tamaño "Ludicrous" (255x255 tiles):

Culling: El motor solo renderiza lo que está dentro del radio de visión de la cámara.
FOW Buffering: El cálculo de la visión se realiza en una grilla de baja resolución y se escala, ahorrando ciclos de CPU.
Static Resource Grid: Los recursos (árboles, minas) se almacenan en una grilla estática separada de las unidades móviles para búsquedas ultra rápidas.
5. Roadmap y Próximos Pasos
Basado en los archivos README.md y el estado del código:

En Desarrollo (v1.2): Mejora de la IA del enemigo (actualmente básica), más civilizaciones y un tutorial interactivo.
Futuro (v2.0): Integración de Multijugador mediante WebSockets y un editor de mapas integrado.
6. Conclusión Técnica
El código está altamente optimizado y bien documentado. La transición a módulos ES6 está completa en su mayoría, aunque persisten algunas variables globales para compatibilidad con scripts antiguos (como el cargador de datos). Estructuralmente, es un proyecto sólido preparado para recibir contenido adicional o incluso una capa multijugador.

TIP

Recomendación: Para el próximo sprint, se sugiere terminar de extraer los últimos scripts globales (technologies.js, mapGenerator.js) a módulos ES6 puros para asegurar una arquitectura 100% moderna.

