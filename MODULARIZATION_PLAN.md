# 🔄 Plan de Modularización del Proyecto

**Fecha de inicio**: 2025-12-02  
**Estado**: En progreso  
**Objetivo**: Modularizar el código sin romper funcionalidad existente

---

## 📊 Progreso General

**Total de módulos planificados**: 25  
**Módulos completados**: 17  
**Progreso**: 68%

---

## ✅ Fase 1: Utilidades y Core (COMPLETADA)

### js/utils/
- [x] `DebugLogger.js` - Sistema de logging centralizado

### js/core/
- [x] `constants.js` - Configuración y constantes del juego

---

## ✅ Fase 2: Sistemas de Mapa (COMPLETADA)

### js/map/
- [x] `GridMap.js` - Sistema de cuadrícula para construcción
- [x] `TerrainMap.js` - Generación y gestión de terrenos

---

## ✅ Fase 3: Managers (COMPLETADA)

### js/managers/
- [x] `AssetLoader.js` - Carga de assets gráficos
- [x] `SpatialGrid.js` - Optimización espacial

---

## ✅ Fase 4: Entidades Base (COMPLETADA)

### js/entities/
- [x] `Entity.js` - Clase base para todas las entidades
- [x] `Unit.js` - Clase base para unidades móviles
- [x] `Building.js` - Clase base para edificios

**Archivos origen**: `game.js` (líneas 1742-2244)  
**Prioridad**: Alta - Son la base para todas las entidades específicas

---

## ✅ Fase 5: Unidades Específicas (COMPLETADA)

### js/entities/units/
- [x] `Villager.js` - Aldeano (recolección, construcción)
- [x] `Warrior.js` - Guerrero (combate cuerpo a cuerpo)
- [x] `Archer.js` - Arquero (combate a distancia)

**Archivos origen**: `game.js` (líneas 2025-2232)  
**Dependencias**: `Entity.js`, `Unit.js`

---

## ✅ Fase 6: Edificios Específicos (COMPLETADA)

### js/entities/buildings/
- [x] `TownCenter.js` - Centro Urbano
- [x] `House.js` - Casa
- [x] `Barracks.js` - Cuartel
- [x] `Storage.js` - Depósito general
- [x] `StorageWood.js` - Depósito de madera
- [x] `Market.js` - Mercado
- [x] `Temple.js` - Templo
- [x] `Workshop.js` - Taller

**Archivos origen**: `game.js` (líneas 2249-2343)  
**Dependencias**: `Entity.js`, `Building.js`

---

## ⏳ Fase 7: Clase Principal del Juego (PENDIENTE)

### js/core/
- [ ] `Game.js` - Clase principal que orquesta todo

**Archivos origen**: `game.js` (líneas 384-1680)  
**Dependencias**: Todos los módulos anteriores  
**Complejidad**: Alta - 1300 líneas de código  
**Nota**: Este será el módulo más complejo de extraer

---

## ⏳ Fase 8: UI y Helpers (PENDIENTE)

### js/ui/
- [ ] `UIManager.js` - Gestión de interfaz de usuario
- [ ] `ScreenManager.js` - Gestión de pantallas del juego

**Funcionalidad a extraer**:
- Funciones globales de UI (showTechTree, hideTechTree, etc.)
- Gestión de pantallas (start, mapSize, civSelection, game)
- Renderizado de paneles de recursos

---

## ⏳ Fase 9: Punto de Entrada (PENDIENTE)

- [ ] `main.js` - Archivo principal que importa y coordina todos los módulos
- [ ] Actualizar `index.html` para usar módulos ES6

---

## 📝 Checklist de Calidad por Módulo

Para cada módulo extraído, verificar:

- [x] ¿Usa `export` para la clase/función principal?
- [x] ¿Importa sus dependencias con `import`?
- [x] ¿Tiene comentarios JSDoc?
- [x] ¿Mantiene exactamente la misma funcionalidad?
- [x] ¿Está documentado en CODE_INDEX.md?
- [ ] ¿Se ha probado que funciona integrado?

---

## 🎯 Próximos Pasos

### Inmediato (Siguiente sesión)
1. Extraer `Entity.js` - Clase base
2. Extraer `Unit.js` - Clase base de unidades
3. Extraer `Building.js` - Clase base de edificios

### Corto plazo
4. Extraer unidades específicas (Villager, Warrior, Archer)
5. Extraer edificios específicos

### Mediano plazo
6. Extraer clase Game (la más compleja)
7. Crear UIManager
8. Crear main.js y actualizar HTML

###

 Largo plazo
9. Pruebas de integración
10. Optimización de imports
11. Documentación completa
12. Commit final

---

## 🚨 Consideraciones Importantes

### NO Hacer
- ❌ NO cambiar nombres de variables/métodos
- ❌ NO optimizar código durante la extracción
- ❌ NO reorganizar lógica
- ❌ NO eliminar código "legacy" que funciona

### SÍ Hacer
- ✅ Copiar código exactamente como está
- ✅ Agregar exports/imports necesarios
- ✅ Mantener comentarios originales
- ✅ Documentar ubicación en CODE_INDEX.md
- ✅ Probar que no rompe funcionalidad

---

## 🔧 Configuración de Migración

### Compatibilidad Temporal
Durante la migración, el proyecto mantendrá:
- Archivos originales sin modificar (game.js, debugLogger.js, etc.)
- Nuevos módulos en carpeta `js/`
- Index.html cargando archivos originales

**Cambio final**: Solo cuando TODOS los módulos estén listos, se actualizará index.html para usar los nuevos módulos.

---

## 📦 Archivos que NO se Modularizarán

Estos archivos ya están bien organizados o son archivos de datos:

- `technologies.js` - Ya está separado y funcional
- `mapGenerator.js` - Ya está separado
- `soundManager.js` - Ya está separado
- `dataLoader.js` - Ya está separado
- `effects.js` - Ya está separado
- `*.json` - Archivos de datos
- `*.css` - Hojas de estilo
- `*.md` - Documentación

---

## 📈 Métricas de Código

### Antes de Modularización
- **game.js**: 3015 líneas, 110 KB
- **Total archivos JS raíz**: ~10 archivos
- **Clases en un solo archivo**: 30+

### Después de Modularización (Objetivo)
- **Archivo más grande**: < 500 líneas
- **Total módulos**: ~25 archivos
- **Clases por archivo**: 1-2 máximo
- **Estructura de carpetas**: 6 carpetas principales

---

## 🎓 Lecciones Aprendidas

1. **Los módulos ES6 necesitan servidor HTTP**: No funcionan con file://
2. **Los imports son síncronos**: El orden de carga importa
3. **Las instancias globales** (assetLoader, debugLogger) deben exportarse
4. **La compatibilidad hacia atrás** es crítica durante la migración

---

## 📅 Timeline Estimado

- **Fase 1-3** (Completada): 1 sesión ✅
- **Fase 4**: 1 sesión (siguiente)
- **Fase 5-6**: 2 sesiones
- **Fase 7**: 2 sesiones (Game.js es complejo)
- **Fase 8-9**: 1 sesión
- **Testing final**: 1 sesión

**Total estimado**: 8 sesiones de trabajo

---

**Última actualización**: 2025-12-02 18:22  
**Módulos completados hoy**: 17/25
