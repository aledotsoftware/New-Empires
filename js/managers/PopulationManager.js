import { CONFIG } from '../core/constants.js';

/**
 * PopulationManager - Gestor de Población
 * Se encarga de controlar los límites máximos y la población actual.
 */
export class PopulationManager {
    constructor() {
        this.population = CONFIG.STARTING_POPULATION;
        this.maxPopulation = CONFIG.STARTING_MAX_POPULATION;
    }

    reset() {
        this.population = CONFIG.STARTING_POPULATION;
        this.maxPopulation = CONFIG.STARTING_MAX_POPULATION;
    }

    addPopulation(amount) {
        this.population += amount;
    }

    removePopulation(amount) {
        this.population -= amount;
        if (this.population < 0) {
            this.population = 0;
        }
    }

    increaseMaxPopulation(amount) {
        this.maxPopulation += amount;
    }

    decreaseMaxPopulation(amount) {
        this.maxPopulation -= amount;
        if (this.maxPopulation < CONFIG.STARTING_MAX_POPULATION) {
            this.maxPopulation = CONFIG.STARTING_MAX_POPULATION;
        }
    }

    canAddPopulation(amount = 1, currentQueueLength = 0) {
        return (this.population + currentQueueLength + amount) <= this.maxPopulation;
    }

    getPopulation() {
        return Math.floor(this.population);
    }

    getMaxPopulation() {
        return Math.floor(this.maxPopulation);
    }

    loadState(population, maxPopulation) {
        if (population !== undefined) {
            this.population = population;
        }
        if (maxPopulation !== undefined) {
            this.maxPopulation = maxPopulation;
        }
    }
}
