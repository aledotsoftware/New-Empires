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
        this.icon = '❓';
        this.name = 'Entity';
        this.type = 'entity';
        this.isUnit = false;
        this.isBuilding = false;

        // Sistema de imágenes
        this.image = null;
        // Intentar cargar imagen automáticamente en el próximo ciclo
        setTimeout(() => this.loadIcon(), 0);
    }

    loadIcon() {
        if (!this.type) return;
        // assetLoader es una variable global disponible en el scope del juego
        if (typeof assetLoader !== 'undefined') {
            const preloadedImage = assetLoader.getImage(this.type);
            if (preloadedImage) {
                this.image = preloadedImage;
            }
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

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // CONFIG es una variable global disponible
        if (typeof CONFIG !== 'undefined') {
            if (screenX < -this.size || screenX > CONFIG.CANVAS_WIDTH + this.size ||
                screenY < -this.size || screenY > CONFIG.CANVAS_HEIGHT + this.size) {
                return;
            }
        }

        // Dibujar fondo cuadrado en lugar de redondo
        ctx.fillStyle = this.getTeamColor();
        ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);
        } else {
            ctx.font = `${this.size * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, screenX, screenY);
        }

        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - this.size - 10;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#48bb78';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
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
