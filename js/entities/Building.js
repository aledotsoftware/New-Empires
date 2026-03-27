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

        // Damage effect timer
        this.damageEffectTimer = 0;
    }

    update(deltaTime, game) {
        // Continuous damage effect (smoke/fire) if hp < 50%
        if (!this.isDead && !this.isUnderConstruction && this.hp < this.maxHp * 0.5) {
            this.damageEffectTimer -= deltaTime;
            if (this.damageEffectTimer <= 0) {
                // Random interval between 0.5s and 1.5s
                this.damageEffectTimer = Math.random() + 0.5;
                if (game && game.particleSystem) {
                    const severity = 1 - (this.hp / this.maxHp);
                    game.particleSystem.createBuildingDamageEffect(this.x, this.y, severity, this.size);
                }
            }
        }
        return null;
    }
}
