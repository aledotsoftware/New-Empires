# Sistema de Debug y Manejo de Errores

## 📋 Resumen de Mejoras Implementadas

Este documento describe las mejoras realizadas al sistema de manejo de errores y debug del juego.

---

## 🎯 Objetivo

Mejorar el **manejo de errores** y la **información de debug** sin romper la funcionalidad existente, manteniendo compatibilidad total con el código actual.

---

## ✨ Nuevas Características

### 1. Sistema de Debug Logger (`debugLogger.js`)

Un sistema centralizado de logging que proporciona:

#### Características Principales:
- **Categorías de Log**: `game`, `assets`, `sound`, `data`, `ui`, `performance`
- **Niveles de Log**: `debug`, `info`, `warn`, `error`
- **Timestamps Automáticos**: Cada log incluye marca de tiempo precisa
- **Estadísticas de Errores**: Contador y historial de errores
- **Medición de Rendimiento**: Funciones `time()` y `timeEnd()`
- **Configuración Persistente**: Se guarda en localStorage
- **Retrocompatibilidad**: Funciona con o sin el sistema activado

#### Comandos de Consola:

```javascript
// Ver estadísticas generales
debugLogger.showStats()

// Ver historial de errores (últimos 10)
debugLogger.showErrorHistory()

// Cambiar nivel de logging
debugLogger.setLogLevel('debug')  // 'debug', 'info', 'warn', 'error'

// Activar/desactivar categoría específica
debugLogger.toggleCategory('sound')
debugLogger.toggleCategory('assets', false)

// Habilitar/deshabilitar todo el sistema
debugLogger.setEnabled(false)

// Reiniciar estadísticas
debugLogger.resetStats()

// Activar/desactivar timestamps
debugLogger.config.showTimestamp = false

// Activar stack traces en errores
debugLogger.config.showStackTrace = true
```

#### Ejemplo de Uso en Código:

```javascript
// Log simple
debugLogger.info('Juego iniciado', 'game');

// Log con datos adicionales
debugLogger.success('Assets cargados', 'assets', { 
    total: 10, 
    cargados: 8 
});

// Log de error con contexto
debugLogger.error('Error cargando archivo', 'data', error, {
    url: 'path/to/file.json',
    timestamp: Date.now()
});

// Medición de rendimiento
debugLogger.time('Carga de mapa', 'performance');
// ... código a medir ...
debugLogger.timeEnd('Carga de mapa', 'performance');
```

---

### 2. Mejoras en DataLoader

#### Antes:
```javascript
console.log('🔄 Cargando datos base...');
console.error('❌ Error cargando archivo');
```

#### Después:
```javascript
debugLogger.start('Cargando datos base del juego', 'data');
debugLogger.time('Carga de datos base', 'data');

// Con información contextual detallada
debugLogger.error('Error cargando archivo JSON', 'data', error, { 
    url, 
    timestamp: Date.now() 
});

debugLogger.timeEnd('Carga de datos base', 'data');
debugLogger.success('Datos base cargados correctamente', 'data', stats);
```

#### Información Adicional Capturada:
- Tamaño de archivos JSON cargados
- Tiempo de carga de datos base
- Tiempo de carga de civilizaciones
- Lista de civilizaciones disponibles
- Contexto completo en errores de unidades únicas

---

### 3. Mejoras en SoundManager

#### Información Adicional:
- Duración de cada sonido cargado
- Códigos de error específicos en fallos
- Contador de sonidos cargados vs total
- Contexto en errores de reproducción (volumen, estado enabled)

#### Ejemplo de Output:
```
🔄 [15:30:45.123][SOUND] Cargando sonidos del juego
🔍 [15:30:45.234][SOUND] Sonido cargado: selectTownCenter 
   { src: 'assets/sound/selectTownCenter.wav', duration: 1.2 }
✅ [15:30:46.456][SOUND] 8/10 sonidos cargados
   { cargados: ['selectTownCenter', 'selectHouse', ...], total: 10 }
⏱️ [SOUND] Carga de sonidos: 1234ms
```

---

### 4. Mejoras en Game.js (AssetLoader)

#### Información Adicional:
- Dimensiones de imágenes cargadas (width, height)
- Progreso de carga (3/10 assets)
- UserAgent en errores críticos
- Tiempo total de inicialización del juego

---

## 🔧 Configuración

### Configuración por Defecto:

```javascript
{
    enabled: true,
    showTimestamp: true,
    showStackTrace: false,
    logLevel: 'info',
    categories: {
        game: true,
        assets: true,
        sound: true,
        data: true,
        ui: true,
        performance: true
    }
}
```

### Personalización:

```javascript
// Modo debug completo (ver todo)
debugLogger.setLogLevel('debug');
debugLogger.config.showStackTrace = true;

// Modo producción (solo errores)
debugLogger.setLogLevel('error');

// Desactivar categoría ruidosa
debugLogger.toggleCategory('assets', false);

// Guardar configuración
debugLogger.saveConfig();
```

---

## 📊 Estadísticas

El sistema mantiene estadísticas automáticas:

```javascript
debugLogger.stats = {
    errors: 0,           // Total de errores
    warnings: 0,         // Total de advertencias
    lastError: null,     // Último error con detalles
    errorHistory: []     // Últimos 10 errores
}
```

---

## 🔄 Retrocompatibilidad

El sistema es **100% retrocompatible**:

```javascript
// Si debugLogger no está disponible, usa console.log
if (typeof debugLogger !== 'undefined') {
    debugLogger.success('Operación exitosa', 'game');
} else {
    console.log('✅ Operación exitosa');
}
```

Esto asegura que:
- El juego funciona sin debugLogger.js
- No hay errores si el script no se carga
- Mantiene funcionalidad básica con console.log

---

## 🎮 Uso en Desarrollo

### Debugging de Problemas:

1. **Ver últimos errores**:
   ```javascript
   debugLogger.showErrorHistory()
   ```

2. **Activar modo debug completo**:
   ```javascript
   debugLogger.setLogLevel('debug')
   debugLogger.config.showStackTrace = true
   ```

3. **Medir rendimiento de una función**:
   ```javascript
   debugLogger.time('Mi operación', 'performance')
   // ... código ...
   debugLogger.timeEnd('Mi operación', 'performance')
   ```

4. **Filtrar logs por categoría**:
   ```javascript
   // Solo ver logs de sonido
   debugLogger.toggleCategory('game', false)
   debugLogger.toggleCategory('assets', false)
   debugLogger.toggleCategory('data', false)
   // sound sigue activo
   ```

---

## 📝 Archivos Modificados

1. **`debugLogger.js`** (NUEVO) - Sistema de logging
2. **`dataLoader.js`** - Integración de debug logging
3. **`soundManager.js`** - Integración de debug logging
4. **`game.js`** - Integración de debug logging
5. **`index.html`** - Carga de debugLogger.js

---

## ✅ Checklist de Compatibilidad

- [x] No rompe funcionalidad existente
- [x] Mantiene arquitectura actual
- [x] Preserva estilo de código
- [x] Sin efectos laterales
- [x] Retrocompatible al 100%
- [x] Sin impacto en rendimiento
- [x] Configuración opcional
- [x] Funciona sin el sistema activado

---

## 🚀 Próximos Pasos (Opcional)

Posibles mejoras futuras (NO implementadas):

1. Panel de debug visual en el juego
2. Exportar logs a archivo
3. Integración con herramientas de análisis
4. Alertas visuales para errores críticos
5. Gráficos de rendimiento en tiempo real

---

**Fecha de Implementación**: 2025-12-02  
**Versión**: 1.0.0  
**Autor**: Sistema de Mantenimiento de Código
