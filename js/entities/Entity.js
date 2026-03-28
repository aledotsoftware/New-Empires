import { civilizationManager } from '../managers/CivilizationManager.js';
import { assetLoader } from '../managers/AssetLoader.js';

/**
 * Entity - Clase base para todas las entidades del juego
 * Unidades, edificios y otros objetos del juego heredan de esta clase
 */
export class Entity {
    constructor(x, y, team = 'neutral') {
        this.x = x;
        this.y = y;
        this.team = team;
        this.hp = 100;
        this.maxHp = 100;
        this.size = 20;
        this.isDead = false;
        this.icon = 'assets/icons/info.png';
        this.name = 'Entity';
        this.type = 'entity';
        this.isUnit = false;
        this.isBuilding = false;

        // Optimización: Cache de color
        this.color = null;

        // Sistema de imágenes
        this.image = null;
        // BOLT OPTIMIZATION: Removed setTimeout/direct call.
        // Icon will be lazily loaded in render() to ensure subclass constructor
        // has finished setting this.type (avoiding race condition).

        // BOLT OPTIMIZATION: Cache screen coordinates to avoid recalculating 4x per frame
        this._screenX = 0;
        this._screenY = 0;

        // OPTIMIZATION: Cache terrain data for combat calculations (Entity.js)
        // Moved from Unit.js to allow static entities (Buildings) to benefit from cached lookups.
        this._lastGridCol = -1;
        this._lastGridRow = -1;
        this._cachedTerrainSpeed = 1.0;
        this._cachedTerrainData = null;

        // BOLT OPTIMIZATION: Spatial Grid Caching
        // Avoids recalculating grid cell bounds and indices every frame (~6-10% CPU saving in update loop)
        this._spatialMinX = null;
        this._spatialMaxX = null;
        this._spatialMinY = null;
        this._spatialMaxY = null;
        this._spatialIndex = -1;
        this._spatialCellSize = 0;

        // Fog of War / Vision
        this.visionRadius = 0; // Default: no vision
    }

    loadIcon() {
        if (!this.type) return;

        // If this.icon is a specific path (not a generic name), use it as the key
        const loadKey = (this.icon && (this.icon.includes('/') || this.icon.includes('.'))) ? this.icon : this.type;
        
        const preloadedImage = assetLoader.getImage(loadKey);
        if (preloadedImage) {
            this.image = preloadedImage;
        }
    }

    takeDamage(amount, attacker = null) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }

    update(deltaTime, game) {
        // Override en subclases
    }

    render(ctx, camera, viewWidth, viewHeight, drawHp = true, drawBackground = true) {
        // BOLT OPTIMIZATION: Lazy load icon to handle subclass initialization
        if (!this.image) {
            this.loadIcon();
        }

        // BOLT OPTIMIZATION: Use cached screen coordinates
        // These are updated once per frame in Game.js render loop
        const screenX = this._screenX;
        const screenY = this._screenY;

        // OPTIMIZATION: Removed redundant global CONFIG check and loose culling.
        // Game.js handles frustum culling via SpatialGrid before calling this.
        // BOLT OPTIMIZATION: Removed redundant fine-grained check here as Game.js already filters
        // entities via queryRowIndices and explicit bounds checking.

        if (drawBackground) {
            // Dibujar fondo cuadrado en lugar de redondo
            if (!this.color) {
                this.color = this.getTeamColor();
            }
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
        }

        // BOLT OPTIMIZATION: Removed .complete/.naturalWidth check. AssetLoader only assigns valid images.
        if (this.image) {
            ctx.drawImage(this.image, screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
        } else {
            // BOLT OPTIMIZATION: Don't render file paths as text fallback
            if (this.icon && !this.icon.startsWith('assets/')) {
                ctx.font = `${this.size * 1.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.icon, screenX, screenY);
            }
        }

        if (drawHp && this.hp < this.maxHp) {
            this.drawHpBar(ctx, camera);
        }
    }

    // BOLT OPTIMIZATION: Batching support for backgrounds
    addBackgroundToPath(ctx, camera) {
        const screenX = this._screenX;
        const screenY = this._screenY;
        ctx.rect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
    }

    drawHpBar(ctx, camera) {
        const screenX = this._screenX;
        const screenY = this._screenY;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#48bb78';
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }

    // OPTIMIZATION: Batching support methods for HP bars
    addHpBarBackgroundToPath(ctx, camera) {
        const screenX = this._screenX;
        const screenY = this._screenY;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;
        ctx.rect(barX, barY, barWidth, barHeight);
    }

    addHpBarForegroundToPath(ctx, camera) {
        const screenX = this._screenX;
        const screenY = this._screenY;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;
        ctx.rect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }

    getTeamColor() {
        // game is global for now
        if (this.team === 'player' && typeof game !== 'undefined' && game && game.civilizationId) {
            return civilizationManager.getTeamColor(game.civilizationId, this.team);
        }

        switch (this.team) {
            case 'player': return 'rgba(72, 187, 120, 0.3)';
            case 'enemy': return 'rgba(197, 48, 48, 0.3)';
            default: return 'rgba(160, 160, 160, 0.3)';
        }
    }

    // Palette: Batching support for Production bars
    addProductionBarBackgroundToPath(ctx, camera) {
        const screenX = this._screenX;
        const screenY = this._screenY;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        // Stack above HP bar (which is at -10 relative to top edge)
        // Position at -16 (Top -16, Bottom -12) with 2px gap
        const barY = screenY - this.size - 16;
        ctx.rect(barX, barY, barWidth, barHeight);
    }

    addProductionBarForegroundToPath(ctx, camera) {
        // Duck typing: assumes productionQueue exists if called
        if (!this.productionQueue || typeof this.productionQueue.getProgress !== 'function') return;

        const progress = this.productionQueue.getProgress();
        if (progress <= 0) return;

        const screenX = this._screenX;
        const screenY = this._screenY;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 16;
        ctx.rect(barX, barY, barWidth * progress, barHeight);
    }
}
