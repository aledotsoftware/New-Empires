import { TILE_SIZE } from '../core/constants.js';
import { SeededRandom } from './ProceduralMapGenerator.js';

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
        const rng = new SeededRandom(generatedMap.metadata.seed + 888);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const terrain = generatedMap.terrainTypes[y][x];

                // Add probability for decorations based on terrain using deterministic RNG
                if (rng.next() < 0.05) {
                    if (terrain === 'grassland') {
                        if (rng.next() > 0.5) {
                            this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'flower', variant: rng.int(0, 2) });
                        } else {
                            this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'tall_grass', variant: rng.int(0, 1) });
                        }
                    } else if (terrain === 'forest') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'mushroom', variant: rng.int(0, 1) });
                    } else if (terrain === 'desert') {
                        if (rng.next() > 0.5) {
                            this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'cactus', variant: rng.int(0, 1) });
                        } else {
                            this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'dry_brush', variant: rng.int(0, 1) });
                        }
                    } else if (terrain === 'mountain' || terrain === 'hill' || terrain === 'volcanic') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'rock', variant: rng.int(0, 2) });
                    } else if (terrain === 'snow' || terrain === 'tundra') {
                        this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'snow_drift', variant: rng.int(0, 2) });
                    } else if (terrain === 'swamp' || terrain === 'water') {
                        if (rng.next() > 0.8) {
                            this.decorations.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'lily_pad', variant: rng.int(0, 1) });
                        }
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

            const screenX = decor.x - camera.x;
            const screenY = decor.y - camera.y;

            // Draw based on type
            ctx.fillStyle = this.getColorForDecor(decor);
            ctx.beginPath();

            if (decor.type === 'snow_drift') {
                ctx.globalAlpha = 0.8;
                ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else if (decor.type === 'lily_pad') {
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 3, 0.2, Math.PI * 2 - 0.2);
                ctx.lineTo(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                ctx.fill();
            } else if (decor.type === 'tall_grass' || decor.type === 'dry_brush') {
                ctx.lineWidth = 2;
                ctx.strokeStyle = this.getColorForDecor(decor);
                for (let i = 0; i < 3; i++) {
                    ctx.moveTo(screenX + TILE_SIZE/3 + i * 4, screenY + TILE_SIZE/1.5);
                    ctx.lineTo(screenX + TILE_SIZE/3 + i * 4 + (i - 1) * 2, screenY + TILE_SIZE/3 + Math.random() * 4);
                }
                ctx.stroke();
            } else {
                // Default simple arc
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    getColorForDecor(decor) {
        switch (decor.type) {
            case 'flower': return decor.variant === 0 ? '#ffeb3b' : decor.variant === 1 ? '#e91e63' : '#ffffff';
            case 'mushroom': return '#d32f2f';
            case 'cactus': return '#388e3c';
            case 'rock': return '#9e9e9e';
            case 'tall_grass': return decor.variant === 0 ? '#4caf50' : '#8bc34a';
            case 'dry_brush': return decor.variant === 0 ? '#a1887f' : '#bcaaa4';
            case 'snow_drift': return decor.variant === 0 ? '#e0f7fa' : '#ffffff';
            case 'lily_pad': return '#2e7d32';
            default: return '#000000';
        }
    }
}
