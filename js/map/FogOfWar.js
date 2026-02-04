import { FOW_STATES, TILE_SIZE, CONFIG } from '../core/constants.js';

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

        // BOLT OPTIMIZATION: Track visible ranges to avoid O(TotalTiles) iteration in resetVisible
        this.visibleRanges = [];
        // BOLT OPTIMIZATION: Track previous frame's ranges for incremental buffer update
        this._previousVisibleRanges = [];

        // BOLT OPTIMIZATION: Buffers for batched update
        // Stores triplets of [row, startCol, endCol]
        this._batchRanges = new Int32Array(4096 * 3); // Start with reasonable size
        this._batchCount = 0;
        this._batchIndices = new Uint32Array(4096);
    }

    /**
     * Resets currently visible tiles to 'EXPLORED' before re-calculating vision.
     */
    resetVisible() {
        // BOLT OPTIMIZATION: Only iterate ranges that were actually visible
        // Reduces cost from O(TotalTiles) to O(VisibleTiles) - typically >100x speedup
        const len = this.visibleRanges.length;
        if (len > 0) {
            // BOLT OPTIMIZATION: Save previous ranges for incremental buffer update
            // Swap arrays to avoid allocation
            const temp = this._previousVisibleRanges;
            this._previousVisibleRanges = this.visibleRanges;
            this.visibleRanges = temp;
            this.visibleRanges.length = 0;

            // Reset tiles to EXPLORED using saved ranges
            const prevLen = this._previousVisibleRanges.length;
            for (let i = 0; i < prevLen; i += 2) {
                const start = this._previousVisibleRanges[i];
                const end = this._previousVisibleRanges[i + 1];
                this.grid.fill(FOW_STATES.EXPLORED, start, end + 1);
            }
            this.isDirty = true;
        }
    }

    /**
     * Updates visibility based on a list of player entities.
     * @param {Array} entities - Entities that provide vision.
     */
    update(entities) {
        this.resetVisible();
        this._batchCount = 0;

        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if (ent.isDead) continue;

            this._bufferCircle(ent.x, ent.y, ent.visionRadius || 200);
        }

        this._flushBuffer();
    }

    /**
     * Reveals a circular area on the FOW grid.
     * BOLT OPTIMIZATION: Now uses buffering + flush to ensure API compatibility
     * while utilizing the batching optimization logic.
     */
    revealCircle(centerX, centerY, radius) {
        this._batchCount = 0;
        this._bufferCircle(centerX, centerY, radius);
        this._flushBuffer();
    }

    /**
     * Internal method to calculate scanlines and buffer them.
     * Replaces previous immediate revealCircle logic.
     */
    _bufferCircle(centerX, centerY, radius) {
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
            const span = Math.floor(Math.sqrt(term));
            const minX = Math.max(0, gridX - span);
            const maxX = Math.min(this.cols - 1, gridX + span);

            if (minX > maxX) continue;

            // Buffer the range [y, minX, maxX]
            // Resize buffers if necessary
            if (this._batchCount >= this._batchIndices.length) {
                const newSize = this._batchIndices.length * 2;
                const newIndices = new Uint32Array(newSize);
                const newRanges = new Int32Array(newSize * 3);

                newIndices.set(this._batchIndices);
                newRanges.set(this._batchRanges);

                this._batchIndices = newIndices;
                this._batchRanges = newRanges;
            }

            const idx = this._batchCount;
            const rIdx = idx * 3;
            this._batchRanges[rIdx] = y;
            this._batchRanges[rIdx + 1] = minX;
            this._batchRanges[rIdx + 2] = maxX;

            // Set index for sorting
            this._batchIndices[idx] = idx;
            this._batchCount++;
        }
    }

    /**
     * Sorts, merges, and applies buffered ranges.
     * BOLT OPTIMIZATION: Reduces redundant memory writes by merging overlapping ranges
     * before touching the Uint8Array.
     */
    _flushBuffer() {
        if (this._batchCount === 0) return;

        // 1. Sort Indices
        // We only sort the active portion of the indices array
        const indices = this._batchIndices.subarray(0, this._batchCount);
        const ranges = this._batchRanges;

        // Sort by Row, then Start Column
        indices.sort((a, b) => {
            const rA = a * 3;
            const rB = b * 3;
            const rowA = ranges[rA];
            const rowB = ranges[rB];
            if (rowA !== rowB) return rowA - rowB;
            return ranges[rA + 1] - ranges[rB + 1];
        });

        // 2. Merge & Fill
        let currentStart = -1;
        let currentEnd = -1;
        let currentRow = -1;
        let rowOffset = 0;
        let visibleCount = this.visibleRanges.length;

        for (let i = 0; i < this._batchCount; i++) {
            const rIdx = indices[i] * 3;
            const r = ranges[rIdx];
            const s = ranges[rIdx + 1];
            const e = ranges[rIdx + 2];

            if (r !== currentRow) {
                // Flush previous range from different row
                if (currentRow !== -1) {
                    const startIdx = rowOffset + currentStart;
                    const endIdx = rowOffset + currentEnd;
                    this.grid.fill(FOW_STATES.VISIBLE, startIdx, endIdx + 1);
                    this.visibleRanges[visibleCount++] = startIdx;
                    this.visibleRanges[visibleCount++] = endIdx;
                }
                // Start new row
                currentRow = r;
                rowOffset = r * this.cols;
                currentStart = s;
                currentEnd = e;
            } else {
                // Same row: Check overlap
                // Ranges are sorted by start, so we only check if start <= oldEnd + 1
                if (s <= currentEnd + 1) {
                    currentEnd = Math.max(currentEnd, e);
                } else {
                    // Gap found: Flush previous range
                    const startIdx = rowOffset + currentStart;
                    const endIdx = rowOffset + currentEnd;
                    this.grid.fill(FOW_STATES.VISIBLE, startIdx, endIdx + 1);
                    this.visibleRanges[visibleCount++] = startIdx;
                    this.visibleRanges[visibleCount++] = endIdx;

                    currentStart = s;
                    currentEnd = e;
                }
            }
        }

        // Flush last range
        if (currentRow !== -1) {
            const startIdx = rowOffset + currentStart;
            const endIdx = rowOffset + currentEnd;
            this.grid.fill(FOW_STATES.VISIBLE, startIdx, endIdx + 1);
            this.visibleRanges[visibleCount++] = startIdx;
            this.visibleRanges[visibleCount++] = endIdx;
        }

        this.isDirty = true;
    }

    /**
     * Checks if a specific tile is currently visible.
     */
    isVisible(col, row) {
        // BOLT: When FOW is disabled, everything is visible
        if (!CONFIG.VISION.ENABLED) return true;
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.grid[row * this.cols + col] === FOW_STATES.VISIBLE;
    }

    /**
     * Checks if a specific tile has been explored.
     */
    isExplored(col, row) {
        // BOLT: When FOW is disabled, everything is explored
        if (!CONFIG.VISION.ENABLED) return true;
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
