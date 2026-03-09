/**
 * ProductionQueue - Sistema de cola de producción para edificios
 * Permite encolar múltiples unidades y entrenarlas secuencialmente
 */
export class ProductionQueue {
    constructor(building, maxSize = 5) {
        this.building = building;
        this.queue = [];
        this.maxSize = maxSize;
    }

    /**
     * Obtiene el número de items en la cola
     * @returns {number}
     */
    get length() {
        return this.queue.length;
    }

    /**
     * Verifica si la cola está llena
     * @returns {boolean}
     */
    isFull() {
        return this.queue.length >= this.maxSize;
    }

    /**
     * Verifica si la cola está vacía
     * @returns {boolean}
     */
    isEmpty() {
        return this.queue.length === 0;
    }

    /**
     * Añade una unidad a la cola de producción
     * @param {string} unitType - Tipo de unidad a producir
     * @param {Object} cost - Costo de la unidad
     * @param {number} productionTime - Tiempo de producción en segundos
     * @returns {boolean} true si se añadió correctamente
     */
    enqueue(unitType, cost, productionTime) {
        if (this.isFull()) {
            return false;
        }

        this.queue.push({
            unitType,
            cost,
            remaining: productionTime,
            total: productionTime,
            startTime: Date.now()
        });

        return true;
    }

    /**
     * Cancela el item más reciente de la cola
     * @returns {Object|null} El item cancelado o null si la cola está vacía
     */
    cancelLast() {
        if (this.isEmpty()) {
            return null;
        }
        return this.queue.pop();
    }

    /**
     * Cancela un item específico de la cola
     * @param {number} index - Índice del item a cancelar
     * @returns {Object|null} El item cancelado o null
     */
    cancelAt(index) {
        if (index < 0 || index >= this.queue.length) {
            return null;
        }
        return this.queue.splice(index, 1)[0];
    }

    /**
     * Actualiza la cola de producción
     * @param {number} deltaTime - Tiempo transcurrido en segundos
     * @returns {Object|null} Retorna el item completado o null
     */
    update(deltaTime) {
        if (this.isEmpty()) {
            return null;
        }

        // Solo procesar el primer item (el que está en producción)
        const current = this.queue[0];
        current.remaining -= deltaTime;

        if (current.remaining <= 0) {
            // Unidad completada, remover de la cola y retornar
            return this.queue.shift();
        }

        return null;
    }

    /**
     * Obtiene el progreso del item actual (0-1)
     * @returns {number}
     */
    getProgress() {
        if (this.isEmpty()) {
            return 0;
        }

        const current = this.queue[0];
        return 1 - (current.remaining / current.total);
    }

    /**
     * Obtiene información del item actual en producción
     * @returns {Object|null}
     */
    getCurrentItem() {
        return this.queue[0] || null;
    }

    /**
     * Obtiene toda la cola
     * @returns {Array}
     */
    getQueue() {
        return [...this.queue];
    }

    /**
     * Limpia toda la cola
     * @returns {Array} Items cancelados
     */
    clear() {
        const cancelled = [...this.queue];
        this.queue = [];
        return cancelled;
    }

    /**
     * Serializa la cola para guardado
     * @returns {Object}
     */
    serialize() {
        const serializedQueue = [];
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            serializedQueue.push({
                unitType: item.unitType,
                remaining: item.remaining,
                total: item.total
            });
        }

        return {
            buildingId: this.building?.id || null,
            maxSize: this.maxSize,
            queue: serializedQueue
        };
    }

    /**
     * Restaura una cola desde datos serializados
     * @param {Object} data - Datos serializados
     */
    static deserialize(data, building) {
        const queue = new ProductionQueue(building, data.maxSize);
        for (const item of data.queue) {
            queue.queue.push({
                unitType: item.unitType,
                cost: {},  // El costo ya fue cobrado
                remaining: item.remaining,
                total: item.total,
                startTime: Date.now() - ((item.total - item.remaining) * 1000)
            });
        }
        return queue;
    }
}

