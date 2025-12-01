# Cambios para Configuración de Cuadrícula e Íconos Cuadrados

## Objetivo
1. Agregar opción para mostrar/ocultar cuadrícula (accesible desde partida)
2. Cambiar íconos redondos a cuadrados (edificios y unidades)

## Cambios en `game.js`

### Cambio 1: Agregar variable `showGrid` en constructor
**Ubicación:** Línea 391 (después de `this.cameraSpeed = 10;`)

**Buscar:**
```javascript
        // Control de cámara
        this.camera = { x: 0, y: 0 };
        this.cameraSpeed = 10;

        // Mouse
```

**Reemplazar con:**
```javascript
        // Control de cámara
        this.camera = { x: 0, y: 0 };
        this.cameraSpeed = 10;
        
        // Configuración de visualización
        this.showGrid = true; // Mostrar/ocultar cuadrícula (configurable)

        // Mouse
```

---

### Cambio 2: Modificar método `render` para cuadrícula condicional
**Ubicación:** Línea 976 (en el método `render()`)

**Buscar:**
```javascript
        // Dibujar terreno
        this.drawTerrain();

        // Dibujar grid
        this.drawGrid();
```

**Reemplazar con:**
```javascript
        // Dibujar terreno
        this.drawTerrain();

        // Dibujar grid (solo si está activado)
        if (this.showGrid) {
            this.drawGrid();
        }
```

---

### Cambio 3: Cambiar renderizado de Entity de circular a cuadrado
**Ubicación:** Línea 1463 (en el método `Entity.render`)

**Buscar:**
```javascript
        ctx.fillStyle = this.getTeamColor();
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size * 0.8, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.image, screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
            ctx.restore();
```

**Reemplazar con:**
```javascript
        // Dibujar fondo cuadrado en lugar de redondo
        ctx.fillStyle = this.getTeamColor();
        ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
```

---

### Cambio 4: Agregar función para alternar cuadrícula
**Ubicación:** Al final del archivo (después de la línea 2357, después de `function backToMapSize()`)

**Agregar:**
```javascript

// ==========================================
// FUNCIÓN DE CONFIGURACIÓN - Toggle Grid
// ==========================================
function toggleGrid() {
    if (window.game) {
        game.showGrid = !game.showGrid;
        const toggleElement = document.getElementById('gridToggleValue');
        if (toggleElement) {
            toggleElement.textContent = game.showGrid ? 'Activada' : 'Desactivada';
        }
    }
}
```

---

## Cambios en `index.html`

### Cambio 5: Actualizar modal de configuración
**Ubicación:** Dentro del div `#settingsScreen` (aproximadamente línea 65-100)

**Buscar el botón de restaurar valores** (que dice "🔄 Restaurar Valores Predeterminados")

**Inmediatamente después de ese botón, agregar:**
```html
                        
                        <div style="margin-bottom: 30px; padding-top: 20px; border-top: 1px solid rgba(212, 175, 55, 0.3);">
                            <h3 style="margin-bottom: 20px; color: #d4af37;">Visualización</h3>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                                <label style="font-weight: 600;">
                                    Mostrar Cuadrícula: <span id="gridToggleValue">Activada</span>
                                </label>
                                <button class="btn-secondary" onclick="toggleGrid()" style="padding: 8px 16px;">
                                    Alternar
                                </button>
                            </div>
                        </div>
```

---

## Verificación

Después de hacer los cambios:
1. Comprueba que el juego carga sin errores
2. Abre la configuración (⚙️) y verifica que aparece la opción de cuadrícula
3. Prueba alternar la cuadrícula y confirma que funciona
4. Verifica que las unidades y edificios ahora son cuadrados

## Commit

Una vez verificado, hacer commit con:
```bash
git add game.js index.html
git commit -m "feat: agregar opción para mostrar/ocultar cuadrícula y cambiar íconos a cuadrados

- Agregada variable showGrid configurable en constructor del juego
- Modificado método render para dibujar cuadrícula condicionalmente
- Cambiado renderizado de entidades de circular a cuadrado
- Agregada función toggleGrid() para alternar cuadrícula desde el menú
- Actualizado modal de configuración con control de visualización de cuadrícula
- Los íconos de edificios y unidades ahora son cuadrados en lugar de redondos"
```
