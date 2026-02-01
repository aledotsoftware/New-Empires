import { FOW_STATES, TILE_SIZE } from '../core/constants.js';

/**
 * FogOfWar - Manages the visibility state of the map.
 * Tracks unexplored, explored, and currently visible areas.
 */
export class FogOfWar {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.totalTiles = cols * rows;
        this.invTileSize = 1 / TILE_SIZE;

        // Uint8Array to store FOW_STATES for each tile
        // 0: HIDDEN, 1: EXPLORED, 2: VISIBLE
        this.grid = new Uint8Array(this.totalTiles);

        // Cache to store visibility from previous frame for delta-checks if needed
        this._previousGrid = new Uint8Array(this.totalTiles);

        // Buffer for offscreen FOW rendering if needed (optional optimization)
        this.isDirty = true;
    }

    /**
     * Resets currently visible tiles to 'EXPLORED' before re-calculating vision.
     */
    resetVisible() {
        for (let i = 0; i < this.totalTiles; i++) {
            if (this.grid[i] === FOW_STATES.VISIBLE) {
                this.grid[i] = FOW_STATES.EXPLORED;
            }
        }
        this.isDirty = true;
    }

    /**
     * Updates visibility based on a list of player entities.
     * @param {Array} entities - Entities that provide vision.
     */
    update(entities) {
        this.resetVisible();

        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if (ent.isDead) continue;

            this.revealCircle(ent.x, ent.y, ent.visionRadius || 200);
        }
    }

    /**
     * Reveals a circular area on the FOW grid.
     */
    revealCircle(centerX, centerY, radius) {
        const gridX = (centerX * this.invTileSize) | 0;
        const gridY = (centerY * this.invTileSize) | 0;
        const gridRadius = (radius * this.invTileSize) | 0;
        const gridRadiusSq = gridRadius * gridRadius;

        const startY = Math.max(0, gridY - gridRadius);
        const endY = Math.min(this.rows - 1, gridY + gridRadius);

        for (let y = startY; y <= endY; y++) {
            const dy = y - gridY;
            // Calculate span width at this Y using the circle equation: x^2 + dy^2 <= r^2
            const term = gridRadiusSq - dy * dy;

            // Skip if outside circle (corner cases with rounding)
            if (term < 0) continue;

            // BOLT OPTIMIZATION: Scanline Fill
            // Calculate horizontal span using sqrt once per row instead of checking distSq per pixel.
            // Use TypedArray.fill for vectorized memory write (much faster than loop assignment).
            const span = Math.floor(Math.sqrt(term));

            const minX = Math.max(0, gridX - span);
            const maxX = Math.min(this.cols - 1, gridX + span);

            if (minX > maxX) continue;

            const rowOffset = y * this.cols;
            const startIdx = rowOffset + minX;
            const endIdx = rowOffset + maxX;

            // Fill range with VISIBLE
            // Note: Overwriting VISIBLE with VISIBLE is fine and fast.
            this.grid.fill(FOW_STATES.VISIBLE, startIdx, endIdx + 1);
            this.isDirty = true;
        }
    }

    /**
     * Checks if a specific tile is currently visible.
     */
    isVisible(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.grid[row * this.cols + col] === FOW_STATES.VISIBLE;
    }

    /**
     * Checks if a specific tile has been explored.
     */
    isExplored(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        const state = this.grid[row * this.cols + col];
        return state === FOW_STATES.EXPLORED || state === FOW_STATES.VISIBLE;
    }

    /**
     * Get FOW state at pixel coordinates.
     */
    getStateAt(x, y) {
        const col = (x * this.invTileSize) | 0;
        const row = (y * this.invTileSize) | 0;
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return FOW_STATES.HIDDEN;
        return this.grid[row * this.cols + col];
    }
}
