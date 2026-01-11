# 📜 Changelog - New Empires

Todos los cambios notables del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Por Hacer
- Modularizar scripts legacy restantes (effects.js, dataLoader.js, etc.)
- Mejoras de IA enemiga
- Más civilizaciones
- Tutorial interactivo

---

## [1.1.0] - 2026-01-11

### ✨ Nuevas Funcionalidades

#### Sistema de Cola de Producción
- Cola de hasta 5 unidades por edificio
- Tiempos de entrenamiento: Aldeano 25s, Guerrero 30s, Arquero 35s
- Interfaz visual con barra de progreso y tiempo restante
- Integrado en Centro Urbano y Cuartel

#### Sistema de Formaciones
- 7 formaciones: línea, columna, caja, cuña, V, círculo, dispersa
- Hotkey **F** para ciclar formaciones
- Funciona con 2+ unidades seleccionadas

#### Sistema de Guardado
- Guardar partida en localStorage
- Cargar partida guardada
- Exportar a archivo JSON
- UI en menú de configuración

#### Grupos de Control
- **Ctrl+1-9** para guardar selección
- **1-9** para seleccionar grupo guardado
- Auto-centrar cámara en grupo seleccionado
- Filtra automáticamente unidades muertas

### 🔧 Correcciones
- `AVAILABLE_CIVS` actualizado de 5 a 12 civilizaciones
- `getStartingResources` corregido para usar `bonuses.startingResources`
- Eliminados archivos obsoletos (backup_styles/, archivos temp)

### ⚡ Optimizaciones
- `_removeDeadInPlace()` - Remoción de entidades sin crear arrays
- `destroy()` - Limpieza de event listeners para prevenir memory leaks
- State key incluye progreso de producción para UI reactiva

### 🗑️ Limpieza
- Movido `game.js` a `_deprecated/`
- Eliminado `backup_styles/` (7 archivos)
- Eliminados archivos temporales

---

## [1.0.0] - 2026-01-10

### 📚 Documentación
- **Reorganizada** toda la documentación del proyecto
- **Creado** índice de documentación (`docs/INDEX.md`)
- **Consolidados** archivos de modularización en uno solo
- **Creadas** guías de instalación, desarrollo y contribución
- **Creada** guía de troubleshooting

---

## [0.9.0] - 2025-12-03

### ✨ Añadido
- Sistema de selección de civilizaciones dinámico
- 5 civilizaciones: Mongols, Sumeria, Romans, Vikings, Argentinians
- Panel de control estilo Age of Empires (grid 3x5)
- Hotkeys Q, W, E, R, T, A, S, D, F, G, Z, X, C, V, B
- Sistema de navegación: Inicio → Mapa → Civilización → Juego

### 🔧 Corregido
- Inicialización async del dataLoader
- Event listeners dinámicos para elementos generados
- CSS para tarjetas de civilización

---

## [0.8.0] - 2025-12-02

### 🏗️ Arquitectura
- **Modularización 76% completada**
- 18 módulos ES6 creados
- Arquitectura de entidades (Entity → Unit/Building)
- Sistema de managers separado
- main.js como punto de entrada

### ✨ Añadido
- `js/core/Game.js` - Clase principal (~1300 líneas)
- `js/core/constants.js` - Configuración global
- Sistema de debug centralizado (`debugLogger`)
- 11 módulos de entidades
- Sistema de grid y terrenos modular

---

## [0.7.0] - 2025-12-02

### ✨ Añadido
- Sistema de datos JSON modular
- Tecnologías, edificios y unidades en JSON
- Personalización por civilización
- Árbol de tecnologías con 30 edades históricas
- Sistema de terrenos con 6 tipos

### 📚 Documentación
- CODE_INDEX.md creado
- Documentación de estructura JSON
- Documentación de sistemas

---

## [0.6.0] - 2025-12-01

### ✨ Añadido
- 7 tamaños de mapa (Tiny a Ludicrous)
- Sistema de civilizaciones con bonificaciones
- Recursos iniciales personalizados por civilización
- Colores de equipo por civilización

---

## [0.5.0] - 2025-11-XX

### ✨ Añadido
- Sistema de construcción completo
- 8+ tipos de edificios
- Sistema de entrenamiento de unidades
- Centro Urbano, Casa, Cuartel, Depósitos, Mercado, Templo, Taller

### 🎮 Gameplay
- 3 tipos de unidades: Aldeano, Guerrero, Arquero
- Sistema de recolección de recursos
- Sistema de combate con IA básica

---

## [0.4.0] - 2025-11-XX

### ✨ Añadido
- Minimapa funcional
- Sistema de cámara con edge scrolling
- Controles de teclado (WASD, flechas)
- Selección de unidades (single y multi-select)

---

## [0.3.0] - 2025-11-XX

### ✨ Añadido
- Generación procedural de mapas
- 6 tipos de terreno
- Nodos de recursos (bosques, minas, granjas)
- Sistema de grid para construcción

---

## [0.2.0] - 2025-11-XX

### ✨ Añadido
- Game loop con requestAnimationFrame
- Sistema de renderizado Canvas
- Entidades básicas
- Sistema de colisiones

---

## [0.1.0] - 2025-11-XX

### 🎉 Lanzamiento Inicial
- Estructura básica del proyecto
- HTML5 Canvas setup
- CSS con tema medieval
- Pantalla de inicio

---

## Tipos de Cambios

- ✨ `Añadido` - para nuevas funcionalidades
- 🔧 `Corregido` - para corrección de bugs
- 🔄 `Cambiado` - para cambios en funcionalidad existente
- 🗑️ `Eliminado` - para funcionalidad removida
- 🚧 `Deprecado` - para funcionalidad que será eliminada
- 🔒 `Seguridad` - para vulnerabilidades
- 🏗️ `Arquitectura` - para cambios estructurales
- 📚 `Documentación` - para cambios en docs

---

**Mantenido por**: New Empires Team
