# 🔧 Guía de Solución de Problemas - New Empires

**Última actualización**: 2026-01-10

---

## 📋 Índice de Problemas

1. [Errores de CORS](#-errores-de-cors)
2. [Errores de Módulos ES6](#-errores-de-módulos-es6)
3. [Problemas de Carga](#-problemas-de-carga)
4. [Problemas de Rendimiento](#-problemas-de-rendimiento)
5. [Problemas de UI](#-problemas-de-ui)
6. [Debug Avanzado](#-debug-avanzado)

---

## 🚫 Errores de CORS

### Error
```
Access to fetch at 'file:///...' has been blocked by CORS policy
```

### Causa
Los navegadores bloquean peticiones `fetch()` desde archivos locales (`file://`) por seguridad.

### Solución
**Usar un servidor HTTP local**:

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server

# Opción 3: VS Code Live Server
# Click derecho en index.html > "Open with Live Server"
```

Luego acceder a: `http://localhost:8000` o similar.

---

## 📦 Errores de Módulos ES6

### Error: "Cannot use import statement outside a module"

**Causa**: Script no cargado como módulo ES6.

**Solución**: Verificar en `index.html`:
```html
<script type="module" src="main.js"></script>
```

---

### Error: "Failed to load module script"

**Causa**: Ruta incorrecta o servidor no activo.

**Solución**:
1. Verificar que el servidor HTTP está corriendo
2. Comprobar que las rutas son correctas (usar rutas relativas)

---

### Error: "debugLogger is not defined"

**Causa**: El debugLogger ahora es un módulo ES6.

**Solución**: Se expone globalmente desde `main.js`:
```javascript
window.debugLogger = debugLogger;
```

---

### Error: "Game is not defined"

**Causa**: Game es un módulo ES6, no global.

**Solución**: Usar `window.game` después de iniciar el juego:
```javascript
if (window.game) {
    window.game.someMethod();
}
```

---

## 🔄 Problemas de Carga

### Pantalla de civilizaciones vacía

**Causa**: `dataLoader` no inicializado antes de poblar la UI.

**Solución**: Verificar que `main.js` tiene:
```javascript
await dataLoader.initialize();
populateCivilizations();
```

**Debug**:
```javascript
// En consola del navegador:
console.log('dataLoader:', typeof dataLoader);
console.log('civilizaciones:', dataLoader?.getAllCivilizations?.()?.length);
```

---

### Assets no cargan (errores 404)

**Causa**: Rutas incorrectas o archivos faltantes.

**Verificar**:
1. Que los archivos existen en `assets/`
2. Que las rutas en el código son correctas
3. Consola de red (F12 > Network) para ver qué falla

---

### Juego no inicia al seleccionar civilización

**Causa**: Error en la inicialización del juego.

**Debug**:
```javascript
// En consola:
console.log('game existe:', !!window.game);
console.log('tipo:', typeof window.game);
```

---

## ⚡ Problemas de Rendimiento

### FPS bajo con muchas unidades

**Causa**: Sobrecarga de renderizado/lógica.

**Soluciones**:
1. Reducir número de unidades
2. Usar mapas más pequeños
3. Verificar que no hay memory leaks

**Diagnóstico**:
```javascript
// Ver FPS actual
console.log('Entidades:', window.game?.entities?.length);
console.log('Unidades:', window.game?.units?.length);
```

---

### El juego se congela

**Causa**: Error en el game loop o bucle infinito.

**Debug**:
1. Pausar ejecución (F12 > Sources > Pause)
2. Revisar call stack
3. Buscar errores en consola

---

## 🖥️ Problemas de UI

### Panel de control no responde

**Diagnóstico completo**:
```javascript
console.clear();
console.log('═══ DIAGNÓSTICO COMPLETO ═══');
console.log('1. Panel existe:', !!document.getElementById('unitControlPanel'));
console.log('2. Grid existe:', !!document.getElementById('actionsGrid'));
console.log('3. Botones totales:', document.querySelectorAll('.action-btn').length);
console.log('4. Game existe:', typeof window.game !== 'undefined');
console.log('5. Unidades seleccionadas:', window.game?.selectedEntities?.length || 0);
console.log('═══ FIN DIAGNÓSTICO ═══');
```

---

### Hotkeys no funcionan (Q, W, E, etc.)

**Verificar**:
1. Que el juego tiene foco (click en el canvas)
2. Que hay una entidad seleccionada
3. Que los event listeners están activos

**Debug**:
```javascript
// Probar detección de teclas:
document.addEventListener('keydown', (e) => console.log('Tecla:', e.key));
```

---

### Minimapa no muestra correctamente

**Causa**: Canvas del minimapa no renderizado.

**Verificar**:
```javascript
console.log('Minimapa:', !!document.getElementById('minimapCanvas'));
console.log('Contexto:', !!document.getElementById('minimapCanvas')?.getContext?.('2d'));
```

---

## 🔍 Debug Avanzado

### Activar modo debug completo

```javascript
// En consola del navegador:
debugLogger.setLogLevel('debug');
debugLogger.config.showStackTrace = true;

// Ver todas las categorías activas:
console.log(debugLogger.config.categories);

// Activar categoría específica:
debugLogger.toggleCategory('performance', true);
```

---

### Ver estadísticas del debugLogger

```javascript
debugLogger.showStats();
```

---

### Ver historial de errores

```javascript
debugLogger.showErrorHistory();
```

---

### Medir rendimiento de operaciones

```javascript
debugLogger.time('MiOperacion', 'performance');
// ... código a medir ...
debugLogger.timeEnd('MiOperacion', 'performance');
```

---

### Inspeccionar estado del juego

```javascript
// Estado general:
console.log({
    recursos: window.game?.resources,
    poblacion: window.game?.population,
    unidades: window.game?.units?.length,
    edificios: window.game?.buildings?.length,
    entidades: window.game?.entities?.length,
    civilizacion: window.game?.civilizationId
});

// Entidad seleccionada:
console.log('Seleccionada:', window.game?.selectedEntities?.[0]);
```

---

## 📝 Reportar un Bug

Si el problema persiste, abre un issue incluyendo:

1. **Navegador y versión**
2. **Sistema operativo**
3. **Mensajes de error** (copiar de consola)
4. **Pasos para reproducir**
5. **Resultado del diagnóstico** (ejecutar scripts de debug arriba)
6. **Capturas de pantalla** si es visual

---

## ✅ Checklist de Verificación Rápida

- [ ] ¿Estás usando servidor HTTP (no `file://`)?
- [ ] ¿La consola muestra errores?
- [ ] ¿Los assets cargan correctamente (Network tab)?
- [ ] ¿El `window.game` existe después de iniciar partida?
- [ ] ¿Recargaste con Ctrl+F5 después de cambios?

---

**Ver también**: [INSTALACION.md](INSTALACION.md) | [DESARROLLO.md](DESARROLLO.md)
