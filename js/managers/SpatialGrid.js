/**
 * SpatialGrid - Sistema de optimización espacial
 * Divide el mapa en celdas para búsquedas eficientes de entidades cercanas
 *
 * OPTIMIZACIÓN:
 * - Se reemplazó Map<string, Array> por Array<Array> plano (1D) para evitar String allocs.
 * - Se reutilizan los arrays de los buckets para evitar GC pressure.
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);

        // Inicializar grid como un array plano de arrays
        // Tamaño = cols * rows
        const size = this.cols * this.rows;
        this.buckets = new Array(size);
        for (let i = 0; i < size; i++) {
            this.buckets[i] = [];
        }
    }

    clear() {
        // En lugar de crear nuevos arrays, vaciamos los existentes
        // Esto reduce drásticamente la presión sobre el Garbage Collector
        const len = this.buckets.length;
        for (let i = 0; i < len; i++) {
            this.buckets[i].length = 0;
        }
    }

    add(entity) {
        const col = Math.floor(entity.x / this.cellSize);
        const row = Math.floor(entity.y / this.cellSize);

        // Verificación de límites simple
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const index = row * this.cols + col;
            this.buckets[index].push(entity);
        }
    }

    // Devuelve entidades en las celdas cercanas
    query(x, y, radius) {
        const entities = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);

        // Clamping para no salir de los bordes al iterar
        const startRow = Math.max(0, centerRow - cellRadius);
        const endRow = Math.min(this.rows - 1, centerRow + cellRadius);
        const startCol = Math.max(0, centerCol - cellRadius);
        const endCol = Math.min(this.cols - 1, centerCol + cellRadius);

        for (let r = startRow; r <= endRow; r++) {
            // Optimización: calcular índice base de la fila
            const rowBase = r * this.cols;
            for (let c = startCol; c <= endCol; c++) {
                const index = rowBase + c;
                const bucket = this.buckets[index];
                // Loop unrolling manual si fuera crítico, pero spread es legible
                // Sin embargo, spread puede ser lento si el bucket es gigante.
                // Usamos push loop mejor.
                const len = bucket.length;
                for(let i = 0; i < len; i++) {
                    entities.push(bucket[i]);
                }
            }
        }

        return entities;
    }
}
