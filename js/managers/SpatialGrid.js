/**
 * SpatialGrid - Sistema de optimización espacial
 * Divide el mapa en celdas para búsquedas eficientes de entidades cercanas.
 * Optimizado para usar un array plano y evitar la creación de strings y garbage collection.
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);

        // Pre-alocar array de buckets
        // Usamos un array plano indexado por (row * cols + col)
        const size = this.cols * this.rows;
        this.buckets = new Array(size);
        for (let i = 0; i < size; i++) {
            this.buckets[i] = [];
        }

        // Lista de índices que contienen entidades en el frame actual
        // Permite limpiar solo los buckets usados en lugar de iterar todo el grid
        this.activeIndices = [];
    }

    clear() {
        // Limpiar solo los buckets activos
        // Es más rápido asignar length = 0 que crear nuevos arrays
        const len = this.activeIndices.length;
        for (let i = 0; i < len; i++) {
            const idx = this.activeIndices[i];
            this.buckets[idx].length = 0;
        }
        this.activeIndices.length = 0;
    }

    add(entity) {
        // Calcular índice
        const col = Math.floor(entity.x / this.cellSize);
        const row = Math.floor(entity.y / this.cellSize);

        // Bounds check
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return;
        }

        const index = row * this.cols + col;

        // Si es la primera entidad en este bucket en este frame, lo marcamos como activo
        if (this.buckets[index].length === 0) {
            this.activeIndices.push(index);
        }

        this.buckets[index].push(entity);
    }

    // Devuelve entidades en las celdas cercanas
    query(x, y, radius) {
        const entities = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);

        // Calcular límites de búsqueda con clamping para no salir del grid
        const startRow = Math.max(0, centerRow - cellRadius);
        const endRow = Math.min(this.rows - 1, centerRow + cellRadius);
        const startCol = Math.max(0, centerCol - cellRadius);
        const endCol = Math.min(this.cols - 1, centerCol + cellRadius);

        for (let r = startRow; r <= endRow; r++) {
            const rowOffset = r * this.cols;
            for (let c = startCol; c <= endCol; c++) {
                const index = rowOffset + c;
                const bucket = this.buckets[index];

                // Iterar manualmente es ligeramente más rápido que spread (...) para arrays pequeños
                // y evita crear arrays temporales intermedios
                const len = bucket.length;
                if (len > 0) {
                    for (let i = 0; i < len; i++) {
                        entities.push(bucket[i]);
                    }
                }
            }
        }

        return entities;
    }

    /**
     * @deprecated Método legado para compatibilidad si algo externo lo usa.
     * Prefiera usar add/query directamente.
     */
    getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }
}
