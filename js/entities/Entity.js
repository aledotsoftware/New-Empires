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
    }

    loadIcon() {
        if (!this.type) return;
        const preloadedImage = assetLoader.getImage(this.type);
        if (preloadedImage) {
            this.image = preloadedImage;
        }
    }

    takeDamage(amount) {
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

        // BOLT OPTIMIZATION: Truncate to integer to avoid sub-pixel rendering cost
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;

        // OPTIMIZATION: Removed redundant global CONFIG check and loose culling.
        // Game.js handles frustum culling via SpatialGrid before calling this.
        // But if viewWidth/viewHeight are passed, we can do a cheap fine-grained check.
        if (viewWidth && viewHeight) {
             if (screenX < -this.size || screenX > viewWidth + this.size ||
                 screenY < -this.size || screenY > viewHeight + this.size) {
                 return;
             }
        }

        if (drawBackground) {
            // Dibujar fondo cuadrado en lugar de redondo
            if (!this.color) {
                this.color = this.getTeamColor();
            }
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
        }

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
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
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;
        ctx.rect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
    }

    drawHpBar(ctx, camera) {
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;
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
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;
        ctx.rect(barX, barY, barWidth, barHeight);
    }

    addHpBarForegroundToPath(ctx, camera) {
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;
        ctx.rect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }

    getTeamColor() {
        // game y civilizationManager son variables globales disponibles
        if (this.team === 'player' && typeof game !== 'undefined' && game && game.civilizationId) {
            if (typeof civilizationManager !== 'undefined') {
                return civilizationManager.getTeamColor(game.civilizationId, this.team);
            }
        }

        switch (this.team) {
            case 'player': return 'rgba(72, 187, 120, 0.3)';
            case 'enemy': return 'rgba(197, 48, 48, 0.3)';
            default: return 'rgba(160, 160, 160, 0.3)';
        }
    }
}
