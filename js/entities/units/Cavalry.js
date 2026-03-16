import { Unit } from '../Unit.js';

/**
 * Cavalry - Caballería
 * Unidad montada rápida
 */
export class Cavalry extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/warrior.png';
        this.name = 'Caballería';
        this.type = 'cavalry';
        this.maxHp = 120;
        this.hp = 120;
        this.attackDamage = 12;
        this.attackSpeed = 1.3;
        this.attackRange = 10;
        this.speed = 80;
        this.canAttack = true;
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        if (enemy.type === 'archer') {
            score += 2500;
        } else if (enemy.type === 'villager') {
            score += 800;
        } else if (enemy.type === 'spearman') {
            score -= 1000; // Avoid spearmen!
        } else if (enemy.isBuilding) {
            score -= 2000;
        }

        // Less penalty for distance since they are fast
        score -= distSq / 80;

        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 20;
        }

        return score;
    }
}
