import { Entity } from './Entity.js';
import { CONFIG } from '../core/constants.js';

/**
 * Building - Clase base para edificios
 * Maneja propiedades específicas de construcciones
 */
export class Building extends Entity {
    constructor(x, y, team) {
        super(x, y, team);
        this.isBuilding = true;
        this.isUnderConstruction = false;
        this.constructionMaxHp = 0;

        // Vision
        this.visionRadius = CONFIG.VISION.DEFAULT_BUILDING;
    }
}
