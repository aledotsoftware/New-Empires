import { TILE_SIZE } from '../core/constants.js';

export class TerrainDecorManager {
    constructor(game) {
        this.game = game;
        this.decorations = [];
        this._minimapDirty = true;
    }

    generateDecorations(generatedMap) {
        this.decorations = [];
        const width = generatedMap.metadata.width;
        const height = generatedMap.metadata.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const terrain = generatedMap.terrainTypes[y][x];

                // Add simple probability for decorations based on terrain
                if (Math.random() < 0.05) {
                    if (terrain === 'grassland') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'flower', variant: Math.floor(Math.random() * 3) });
                    } else if (terrain === 'forest') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'mushroom', variant: Math.floor(Math.random() * 2) });
                    } else if (terrain === 'desert') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'cactus', variant: Math.floor(Math.random() * 2) });
                    } else if (terrain === 'mountain' || terrain === 'hill') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'rock', variant: Math.floor(Math.random() * 3) });
                    }
                }
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();

        for (const decor of this.decorations) {
            // Check if visible
            if (decor.x + TILE_SIZE < camera.x || decor.x > camera.x + this.game.viewWidth ||
                decor.y + TILE_SIZE < camera.y || decor.y > camera.y + this.game.viewHeight) {
                continue;
            }

            // Simple drawing of decorations
            const screenX = decor.x - camera.x;
            const screenY = decor.y - camera.y;

            ctx.fillStyle = this.getColorForDecor(decor);
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getColorForDecor(decor) {
        switch (decor.type) {
            case 'flower': return decor.variant === 0 ? '#ffeb3b' : decor.variant === 1 ? '#e91e63' : '#ffffff';
            case 'mushroom': return '#d32f2f';
            case 'cactus': return '#388e3c';
            case 'rock': return '#9e9e9e';
            default: return '#000000';
        }
    }
}
