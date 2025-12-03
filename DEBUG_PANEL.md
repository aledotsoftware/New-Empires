# 🔧 INSTRUCCIONES DE DEBUG - Panel de Control

## ✅ Cambios Aplicados

He agregado **logs de debug** completos para diagnosticar el problema. Ahora cada acción mostrará información en la consola.

## 📋 Pasos a Seguir

### 1. Recargar el Navegador
Presiona `Ctrl + F5` (o `Cmd + Shift + R` en Mac) para recargar completamente

### 2. Abrir la Consola
- Presiona `F12` 
- Ve a la pestaña "Console"

### 3. Seleccionar una Unidad
- Click en un aldeano o edificio
- **Observa la consola** - debería mostrar información

### 4. Probar los Botones

#### Opción A: Click Manual
1. Click en el botón 🏗️ (Construir)
2. **Observa la consola** - deberías ver:
   ```
   🖱️ Click en botón 0 disabled: false hasAction: true
   ✅ Ejecutando acción del botón 0
   🏗️ openBuildMenu() llamado
   ```

#### Opción B: Presionar Tecla Q
1. Presiona la tecla `Q`
2. **Observa la consola** - deberías ver:
   ```
   ⌨️ Tecla presionada: Q
   🔑 Hotkey detectado: Q -> botón índice 0
   📊 Total botones encontrados: 15
   ✅ Activando botón 0
   🖱️ Click en botón 0 disabled: false hasAction: true
   ✅ Ejecutando acción del botón 0
   🏗️ openBuildMenu() llamado
   ```

## 🎯 Qué Buscar en la Consola

### ✅ Si Funciona Correctamente
Deberías ver una secuencia completa de emojis:
- ⌨️ = Tecla detectada
- 🔑 = Hotkey identificado
- 📊 = Botones encontrados
- ✅ = Acción ejecutándose
- 🏗️ = Método llamado

### ❌ Si NO Funciona

#### Caso 1: No ves NADA en la consola
**Problema**: El evento keydown no se está capturando
**Solución**: 
```javascript
// Pega esto en la consola:
document.addEventListener('keydown', (e) => console.log('TEST KEY:', e.key));
// Luego presiona Q - si no ves "TEST KEY: q", el problema es del navegador/focus
```

#### Caso 2: Ves "⌨️" pero no "🔑"
**Problema**: La tecla no se está detectando como hotkey
**Solución**: Verifica que estás presionando Q, W, E, R, T, A, S, D, F, G, Z, X, C, V, o B

#### Caso 3: Ves "🔑" pero "❌ actionsGrid no encontrado"
**Problema**: El panel no está en el DOM
**Solución**: 
```javascript
// Pega en consola:
console.log('Panel:', !!document.getElementById('unitControlPanel'));
console.log('Grid:', !!document.getElementById('actionsGrid'));
```

#### Caso 4: Ves "⚠️ Botón X no disponible o deshabilitado"
**Problema**: El botón está deshabilitado o no existe
**Solución**: Primero selecciona una unidad/edificio

#### Caso 5: Ves "🖱️ Click" pero "disabled: true"
**Problema**: No tienes suficientes recursos
**Solución**: Normal, el botón está correctamente deshabilitado

#### Caso 6: Ves todo hasta "✅ Ejecutando" pero luego "❌ Error"
**Problema**: Error en el método
**Solución**: Copia el error completo y repórtalo

## 📊 Test Completo

Pega esto en la consola para un diagnóstico completo:

```javascript
console.clear();
console.log('═══ DIAGNÓSTICO COMPLETO ═══');
console.log('1. Panel existe:', !!document.getElementById('unitControlPanel'));
console.log('2. Grid existe:', !!document.getElementById('actionsGrid'));
console.log('3. Botones totales:', document.querySelectorAll('.action-btn').length);
console.log('4. Game existe:', typeof window.game !== 'undefined');
console.log('5. Game es instancia correcta:', window.game?.constructor?.name);
console.log('6. Unidades seleccionadas:', window.game?.selectedEntities?.length || 0);
console.log('7. Panel visible:', !document.getElementById('unitControlPanel')?.classList.contains('hidden'));
console.log('8. CSS cargado:', Array.from(document.styleSheets).some(s => s.href?.includes('control-panel')));

if (window.game?.selectedEntities?.length > 0) {
    const entity = window.game.selectedEntities[0];
    console.log('9. Entidad seleccionada:', entity.type, entity.name);
    console.log('10. openBuildMenu existe:', typeof window.game.openBuildMenu);
    console.log('11. trainUnit existe:', typeof window.game.trainUnit);
}

console.log('═══ FIN DIAGNÓSTICO ═══');
console.log('\nAhora presiona Q y observa los mensajes');
```

## 📝 Qué Reportar

Copia y pega aquí:
1. El resultado del **Test Completo**
2. Los mensajes que aparecen **al presionar Q**
3. Cualquier **mensaje en rojo** (errores)

Con esa información podré identificar exactamente qué está fallando.
