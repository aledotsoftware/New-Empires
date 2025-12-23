# Sistema de Tamaños de Mapa - Implementación

## ✅ Completado en game.js:

1. **Configuración de tamaños de mapa** (MAP_SIZES)
   - Pequeño: 120×120 tiles (3840×3840 px)
   - Chico: 144×144 tiles (4608×4608 px)
   - Mediano: 168×168 tiles (5376×5376 px)
   - Normal: 200×200 tiles (6400×6400 px) - **Por defecto**
   - Grande: 220×220 tiles (7040×7040 px)
   - Gigante: 240×240 tiles (7680×7680 px)
   - Absurdo: 480×480 tiles (15360×15360 px)

2. **Funciones JavaScript**:
   - `showMapSizeSelection()` - Renderiza las tarjetas de selección
   - `selectMapSize(sizeKey)` - Establece el tamaño y avanza a selección de civ
   - `backToMapSize()` - Vuelve a la selección de tamaño

3. **Flujo actualizado**:
   - Inicio → Selección de Tamaño → Selección de Civilización → Juego

## 📋 Pendiente - Agregar al HTML:

Necesitas agregar esta sección en `index.html` después de la pantalla de inicio y antes de la selección de civilización:

```html
<!-- Pantalla de Selección de Tamaño de Mapa -->
<div id="mapSizeScreen" class="start-screen hidden">
    <div class="start-content">
        <h2 class="game-title" style="font-size: 2.5rem; margin-bottom: 30px;">
            Selecciona el Tamaño del Mapa
        </h2>
        <div id="mapSizeGrid" class="map-size-grid">
            <!-- Se llena dinámicamente con JS -->
        </div>
        <button id="backToStartButton" class="btn-secondary" style="margin-top: 20px;">
            ⬅ Volver
        </button>
    </div>
</div>
```

Y actualizar el botón de volver en la selección de civilización:

```html
<button id="backToMapSizeButton" class="btn-secondary" style="margin-top: 20px;">
    ⬅ Volver al Tamaño de Mapa
</button>
```

## 🎨 Estilos CSS Necesarios:

Agregar a `styles.css` o crear `map-size-styles.css`:

```css
/* Selección de Tamaño de Mapa */
.map-size-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

.map-size-card {
    background: rgba(26, 26, 46, 0.6);
    border: 2px solid rgba(212, 175, 55, 0.3);
    border-radius: 15px;
    padding: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
}

.map-size-card:hover {
    transform: translateY(-10px);
    background: rgba(26, 26, 46, 0.8);
    border-color: var(--primary-gold);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
}

.map-size-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.map-size-name {
    font-family: var(--font-title);
    font-size: 1.5rem;
    color: var(--primary-gold);
    margin-bottom: 0.5rem;
}

.map-size-info {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.map-size-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, var(--primary-gold) 0%, var(--primary-gold-light) 100%);
    color: var(--bg-dark);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
```

## 🚀 Cómo funciona:

1. El jugador hace clic en "Comenzar Juego"
2. Se muestra la pantalla de selección de tamaño de mapa
3. Al seleccionar un tamaño, se actualiza `CONFIG.CANVAS_WIDTH` y `CONFIG.CANVAS_HEIGHT`
4. Se avanza automáticamente a la selección de civilización
5. El mapa se genera con el tamaño seleccionado

## 📌 Notas:

- El tamaño "Normal" (200×200) está marcado como recomendado
- Los mapas más grandes requieren más recursos del sistema
- El tamaño "Absurdo" (480×480) es extremadamente grande y puede afectar el rendimiento
