/**
 * SpatialGrid - Sistema de optimización espacial
 * Divide el mapa en celdas para búsquedas eficientes de entidades cercanas
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.buckets = new Map();
    }

    clear() {
        this.buckets.clear();
    }

    add(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.buckets.has(key)) {
            this.buckets.set(key, []);
        }
        this.buckets.get(key).push(entity);
    }

    getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    // Devuelve entidades en las celdas cercanas
    query(x, y, radius) {
        const entities = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);

        for (let r = centerRow - cellRadius; r <= centerRow + cellRadius; r++) {
            for (let c = centerCol - cellRadius; c <= centerCol + cellRadius; c++) {
                const key = `${c},${r}`;
                if (this.buckets.has(key)) {
                    entities.push(...this.buckets.get(key));
                }
            }
        }

        return entities;
    }
}
