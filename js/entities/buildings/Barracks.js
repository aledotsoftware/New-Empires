import { Building } from '../Building.js';
import { ProductionQueue } from '../../systems/ProductionQueue.js';

/**
 * Barracks - Cuartel
 * Entrena unidades militares (guerreros, arqueros)
 */
export class Barracks extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/barracks.png';
        this.name = 'Cuartel';
        this.type = 'barracks';
        this.maxHp = 1200;
        this.hp = 1200;
        this.size = 50;

        // Sistema de cola de producción
        this.productionQueue = new ProductionQueue(this, 5);

        // Unidades que puede entrenar
        this.trainableUnits = ['warrior', 'archer'];

        // Punto de reunión
        this.rallyPoint = null;
    }

    /**
     * Actualiza el edificio (procesa cola de producción)
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {Game} game - Referencia al juego
     * @returns {Object|null} Unidad completada si hay alguna
     */
    update(deltaTime, game) {
        if (this.isUnderConstruction || this.isDead) return null;

        const completed = this.productionQueue.update(deltaTime);
        return completed;
    }

    /**
     * Encola una unidad para producción
     * @param {string} unitType - Tipo de unidad
     * @param {Object} cost - Costo de la unidad
     * @param {number} time - Tiempo de producción
     * @returns {boolean}
     */
    queueUnit(unitType, cost, time) {
        if (!this.trainableUnits.includes(unitType)) {
            return false;
        }
        return this.productionQueue.enqueue(unitType, cost, time);
    }

    /**
     * Obtiene el progreso de producción actual
     * @returns {number} 0-1
     */
    getProductionProgress() {
        return this.productionQueue.getProgress();
    }

    /**
     * Establece el punto de reunión
     * @param {number} x 
     * @param {number} y 
     */
    setRallyPoint(x, y) {
        this.rallyPoint = { x, y };
    }
}
