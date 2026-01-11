# 📚 Índice de Documentación - New Empires

**Última actualización**: 2026-01-11  
**Versión del proyecto**: 1.1.0

---

## 🗂️ Estructura de la Documentación

Esta carpeta contiene toda la documentación técnica y de referencia del proyecto New Empires, un juego de estrategia en tiempo real inspirado en Age of Empires.

---

## 📁 Carpetas

### 🏗️ `/arquitectura`
Documentación sobre la estructura y organización del código.

| Archivo | Descripción |
|---------|-------------|
| [ARQUITECTURA.md](arquitectura/ARQUITECTURA.md) | Guía rápida de arquitectura y archivos activos vs legacy |
| [CODE_INDEX.md](arquitectura/CODE_INDEX.md) | Mapa completo de ubicación de funcionalidades en el código |
| [MODULARIZATION.md](arquitectura/MODULARIZATION.md) | Estado de la modularización ES6 del proyecto |

### ⚙️ `/sistemas`
Documentación de los sistemas del juego.

| Archivo | Descripción |
|---------|-------------|
| [TECH_TREE.md](sistemas/TECH_TREE.md) | Sistema de árbol de tecnologías (30 edades históricas) |
| [TERRAIN_SYSTEM.md](sistemas/TERRAIN_SYSTEM.md) | Sistema de terrenos y efectos tácticos |
| [CIVILIZATIONS.md](sistemas/CIVILIZATIONS.md) | Sistema de civilizaciones y bonificaciones |
| [JSON_STRUCTURE.md](sistemas/JSON_STRUCTURE.md) | Estructura de archivos JSON modulares |
| [DEBUG_SYSTEM.md](sistemas/DEBUG_SYSTEM.md) | Sistema de debug y logging |
| [ALGORITMOS_Y_MAPAS.md](sistemas/ALGORITMOS_Y_MAPAS.md) | Algoritmos de generación y pathfinding |
| [PANEL_CONTROL.md](sistemas/PANEL_CONTROL.md) | Sistema de panel de control estilo AoE |
| [HOTKEYS.md](sistemas/HOTKEYS.md) | Guía completa de controles y hotkeys |
| [RECURSOS.md](sistemas/RECURSOS.md) | Sistema de recursos y economía |
| [UNIDADES_EDIFICIOS.md](sistemas/UNIDADES_EDIFICIOS.md) | Documentación de unidades y edificios |

### 📖 `/guias`
Guías prácticas para desarrolladores y contribuidores.

| Archivo | Descripción |
|---------|-------------|
| [INSTALACION.md](guias/INSTALACION.md) | Guía de instalación y requisitos |
| [DESARROLLO.md](guias/DESARROLLO.md) | Guía de desarrollo y flujos de trabajo |
| [CONTRIBUCION.md](guias/CONTRIBUCION.md) | Guía de contribución al proyecto |
| [TROUBLESHOOTING.md](guias/TROUBLESHOOTING.md) | Solución de problemas comunes |
| [DOCKER.md](guias/DOCKER.md) | Guía de despliegue con Docker |

### 📜 `/historial`
Historial de cambios y documentación archivada.

| Archivo | Descripción |
|---------|-------------|
| [CHANGELOG.md](historial/CHANGELOG.md) | Registro de cambios por versión |
| `/fixes/` | Documentación de fixes específicos (referencia) |

### 📋 Documentos Raíz

| Archivo | Descripción |
|---------|-------------|
| [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) | Plan de mejoras y estado de implementación |

---

## 🚀 ¿Por Dónde Empezar?

### Si eres nuevo en el proyecto:
1. Lee el [README.md](../README.md) principal
2. Revisa [ARQUITECTURA.md](arquitectura/ARQUITECTURA.md) para entender la estructura
3. Consulta [INSTALACION.md](guias/INSTALACION.md) para configurar el entorno

### Si quieres contribuir:
1. Lee [CONTRIBUCION.md](guias/CONTRIBUCION.md)
2. Revisa [CODE_INDEX.md](arquitectura/CODE_INDEX.md) para ubicar funcionalidades
3. Consulta [TROUBLESHOOTING.md](guias/TROUBLESHOOTING.md) si encuentras problemas

### Si necesitas entender un sistema específico:
- Consulta la carpeta `/sistemas/` para documentación detallada

---

## 📝 Convenciones de Documentación

- **Idioma**: Español (con términos técnicos en inglés cuando corresponda)
- **Formato**: Markdown con emojis para mejor navegación
- **Actualización**: Documentar cambios significativos en `CHANGELOG.md`

---

**Mantenedor**: New Empires Team  
**Licencia**: MIT
