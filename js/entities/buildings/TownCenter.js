import { Building } from '../Building.js';
import { ProductionQueue } from '../../systems/ProductionQueue.js';

/**
 * TownCenter - Centro Urbano
 * Edificio principal que entrena aldeanos y sirve como punto de recolección
 */
export class TownCenter extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/townCenter.png';
        this.name = 'Centro Urbano';
        this.type = 'townCenter';
        this.maxHp = 2000;
        this.hp = 2000;
        this.size = 60;

        // Sistema de cola de producción
        this.productionQueue = new ProductionQueue(this, 5);

        // Unidades que puede entrenar
        this.trainableUnits = ['villager'];

        // Punto de reunión (rally point)
        this.rallyPoint = null;
    }

    /**
     * Actualiza el edificio (procesa cola de producción)
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {Game} game - Referencia al juego
     * @returns {Object|null} Unidad completada si hay alguna
     */
    update(deltaTime, game) {
        super.update(deltaTime, game);
        if (this.isUnderConstruction || this.isDead) return null;

        // Collect passive tax income every second if modifier > 1
        if (this.team === 'player' && game && game.modifiers && game.modifiers.taxCollection > 1) {
            if (!this.taxTimer) this.taxTimer = 0;
            this.taxTimer += deltaTime;
            if (this.taxTimer >= 1.0) {
                // Determine raw tax rate dynamically from modifier logic. Let's say +10% adds 0.1 gold per second per TC.
                const taxRate = game.modifiers.taxCollection - 1;
                game.resources.gold += taxRate;
                this.taxTimer = 0;
            }
        }

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
