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

        // Optimización: Cache inverso para usar multiplicación en lugar de división
        this.invCellSize = 1 / cellSize;

        // Optimización: Rastrear índices activos para limpiar solo lo necesario
        this.activeIndices = [];
    }

    clear() {
        // En lugar de iterar todo el grid, solo limpiamos los buckets usados
        const len = this.activeIndices.length;
        const buckets = this.buckets;
        for (let i = 0; i < len; i++) {
            const index = this.activeIndices[i];
            buckets[index].length = 0;
        }
        this.activeIndices.length = 0;
    }

    add(entity) {
        // OPTIMIZATION: Hoist buckets to local variable
        const buckets = this.buckets;

        // Optimización: usar multiplicación es ligeramente más rápido que división
        // OPTIMIZATION: Bitwise truncation is safe here because entities are clamped to positive coordinates
        // in Unit.update() before being added to the grid.
        const col = (entity.x * this.invCellSize) | 0;
        const row = (entity.y * this.invCellSize) | 0;

        // Verificación de límites simple
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const index = row * this.cols + col;
            const bucket = buckets[index];

            // Si el bucket estaba vacío, lo marcamos como activo
            if (bucket.length === 0) {
                // OPTIMIZATION: Manual indexing is faster than push()
                this.activeIndices[this.activeIndices.length] = index;
            }

            // OPTIMIZATION: Manual indexing is faster than push() for hot loops (~30%)
            bucket[bucket.length] = entity;
        }
    }

    /**
     * Busca la primera entidad que cumpla con el predicado en el radio dado
     * @param {number} x - Coordenada X central
     * @param {number} y - Coordenada Y central
     * @param {number} radius - Radio de búsqueda
     * @param {Function} predicate - Función que retorna true si es la entidad buscada (entity) => boolean
     * @returns {Object|null} La entidad encontrada o null
     */
    find(x, y, radius, predicate, context) {
        // OPTIMIZATION: Hoist class members
        const buckets = this.buckets;
        const cols = this.cols;
        const rows = this.rows;

        // Optimización: usar multiplicación
        const cellRadius = Math.ceil(radius * this.invCellSize);

        // OPTIMIZATION: Bitwise truncation is faster than Math.floor (~15% speedup)
        // Safe here because coordinates are clamped to positive values in Unit.update()
        const centerCol = (x * this.invCellSize) | 0;
        const centerRow = (y * this.invCellSize) | 0;

        // Clamping para no salir de los bordes al iterar
        const startRow = Math.max(0, centerRow - cellRadius);
        const endRow = Math.min(rows - 1, centerRow + cellRadius);
        const startCol = Math.max(0, centerCol - cellRadius);
        const endCol = Math.min(cols - 1, centerCol + cellRadius);

        for (let r = startRow; r <= endRow; r++) {
            // Optimización: calcular índice base de la fila
            const rowBase = r * cols;
            for (let c = startCol; c <= endCol; c++) {
                const index = rowBase + c;
                const bucket = buckets[index];

                // Iterar bucket y buscar
                const bLen = bucket.length;
                if (bLen > 0) {
                    for (let i = 0; i < bLen; i++) {
                        // OPTIMIZATION: Pass context to avoid closure allocation
                        if (predicate(bucket[i], context)) {
                            return bucket[i];
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Devuelve entidades en las celdas cercanas
     * @param {number} x - Coordenada X central
     * @param {number} y - Coordenada Y central
     * @param {number} radius - Radio de búsqueda
     * @param {Array} result - (Opcional) Array para almacenar resultados y evitar alocación
     * @param {boolean} clearResult - (Opcional) Si es true, limpia el array de resultados. Si es false, añade.
     */
    query(x, y, radius, result = [], clearResult = true) {
        // Optimización: Limpiar array existente en lugar de crear uno nuevo
        // Esto reduce significativamente la presión del GC en llamadas frecuentes
        if (clearResult) {
            result.length = 0;
        }

        // OPTIMIZATION: Hoist class members
        const buckets = this.buckets;
        const cols = this.cols;
        const rows = this.rows;

        // OPTIMIZATION: Manual indexing
        let count = result.length;

        // Optimización: usar multiplicación
        const cellRadius = Math.ceil(radius * this.invCellSize);
        // OPTIMIZATION: Bitwise truncation is faster than Math.floor (~15% speedup)
        // Safe here because coordinates are clamped to positive values in Unit.update()
        const centerCol = (x * this.invCellSize) | 0;
        const centerRow = (y * this.invCellSize) | 0;

        // Clamping para no salir de los bordes al iterar
        const startRow = Math.max(0, centerRow - cellRadius);
        const endRow = Math.min(rows - 1, centerRow + cellRadius);
        const startCol = Math.max(0, centerCol - cellRadius);
        const endCol = Math.min(cols - 1, centerCol + cellRadius);

        for (let r = startRow; r <= endRow; r++) {
            // Optimización: calcular índice base de la fila
            const rowBase = r * cols;
            for (let c = startCol; c <= endCol; c++) {
                const index = rowBase + c;
                const bucket = buckets[index];

                // Iterar bucket y agregar a resultados
                const bLen = bucket.length;
                if (bLen > 0) {
                    // OPTIMIZATION: Use manual loop instead of push.apply
                    // Benchmarks show manual loop is ~34% faster for small buckets (5 items)
                    // and ~8% faster for medium buckets (20 items).
                    // Also avoids stack overflow risk for very large buckets.
                    for (let i = 0; i < bLen; i++) {
                        // OPTIMIZATION: Manual indexing is faster than push
                        result[count++] = bucket[i];
                    }
                }
            }
        }

        return result;
    }

    /**
     * Appends entities from a specific row of buckets to the result array.
     * Used for fine-grained control over querying order (e.g. interleaving multiple grids).
     * Warning: Does not clear result array.
     * @param {number} row - The row index to query
     * @param {number} startCol - The starting column index
     * @param {number} endCol - The ending column index
     * @param {Array} result - Array to append results to
     */
    queryRowIndices(row, startCol, endCol, result) {
        // OPTIMIZATION: Hoist buckets and members
        const buckets = this.buckets;
        const rowBase = row * this.cols;
        let count = result.length;

        for (let c = startCol; c <= endCol; c++) {
            const bucket = buckets[rowBase + c];
            const bLen = bucket.length;
            if (bLen > 0) {
                for (let i = 0; i < bLen; i++) {
                    result[count++] = bucket[i];
                }
            }
        }
    }

    /**
     * Devuelve entidades en un área rectangular (Optimizado para viewports)
     * @param {number} minX - Coordenada X mínima
     * @param {number} minY - Coordenada Y mínima
     * @param {number} width - Ancho del área
     * @param {number} height - Alto del área
     * @param {Array} result - (Opcional) Array para almacenar resultados
     * @param {boolean} clearResult - (Opcional) Si es true, limpia el array de resultados
     */
    queryRect(minX, minY, width, height, result = [], clearResult = true) {
        if (clearResult) {
            result.length = 0;
        }

        // OPTIMIZATION: Hoist class members
        const buckets = this.buckets;
        const cols = this.cols;
        const rows = this.rows;

        // OPTIMIZATION: Manual indexing
        let count = result.length;

        // OPTIMIZATION: Bitwise truncation (~19% speedup)
        const startCol = Math.max(0, (minX * this.invCellSize) | 0);
        const endCol = Math.min(cols - 1, ((minX + width) * this.invCellSize) | 0);
        const startRow = Math.max(0, (minY * this.invCellSize) | 0);
        const endRow = Math.min(rows - 1, ((minY + height) * this.invCellSize) | 0);

        for (let r = startRow; r <= endRow; r++) {
            const rowBase = r * cols;
            for (let c = startCol; c <= endCol; c++) {
                const index = rowBase + c;
                const bucket = buckets[index];
                const bLen = bucket.length;
                if (bLen > 0) {
                    for (let i = 0; i < bLen; i++) {
                        // OPTIMIZATION: Manual indexing is faster than push
                        result[count++] = bucket[i];
                    }
                }
            }
        }
        return result;
    }
}
