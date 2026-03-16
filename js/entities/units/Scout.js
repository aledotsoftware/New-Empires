import { Unit } from '../Unit.js';
import { CONFIG } from '../../core/constants.js';

/**
 * Scout - Explorador
 * Unidad rápida de exploración
 */
export class Scout extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/villager.png'; // They use villager icon as placeholder in base_units
        this.name = 'Explorador';
        this.type = 'scout';
        this.maxHp = 70;
        this.hp = 70;
        this.attackDamage = 5;
        this.attackSpeed = 1.5;
        this.attackRange = 10;
        this.speed = 100;
        this.canAttack = true;
        this.visionRadius = CONFIG.VISION.DEFAULT_UNIT * 1.5; // Los exploradores ven más lejos
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        if (enemy.type === 'archer') {
            score += 1500;
        } else if (enemy.type === 'villager') {
            score += 1000;
        } else if (enemy.type === 'spearman' || enemy.type === 'warrior') {
            score -= 2000; // Son débiles en combate directo
        } else if (enemy.isBuilding) {
            score -= 3000;
        }

        // Less penalty for distance
        score -= distSq / 100;

        return score;
    }
}
