import { Unit } from '../Unit.js';

/**
 * Spearman - Lancero
 * Infantería con lanza, efectiva contra caballería
 */
export class Spearman extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/warrior.png';
        this.name = 'Lancero';
        this.type = 'spearman';
        this.maxHp = 90;
        this.hp = 90;
        this.attackDamage = 9;
        this.attackSpeed = 1.1;
        this.attackRange = 38;
        this.speed = 48;
        this.canAttack = true;
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        if (enemy.type === 'cavalry' || enemy.type === 'scout') {
            score += 2000;
        } else if (enemy.type === 'warrior') {
            score += 400;
        } else if (enemy.isBuilding) {
            score -= 1000;
        }

        score -= distSq / 15;

        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 10;
        }

        return score;
    }
}
