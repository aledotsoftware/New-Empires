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
        this.attackRange = 75; // Increased slightly to reduce frontline traffic jams
        this.speed = 48;
        this.canAttack = true;
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        if (enemy.type === 'cavalry' || enemy.type === 'scout') {
            score += 4000; // Counter unit: prioritize cavalry very heavily
        } else if (enemy.type === 'warrior') {
            score += 400;
        } else if (enemy.isBuilding) {
            score -= 2000;
        }

        // Distance penalty to prevent endless chasing
        if (this.attackTarget === enemy) {
            // Drop Aggro aggressively if the target moves out of immediate attack range
            if (distSq > this.attackRangeSq * 1.5) {
                score -= distSq / 2;
            } else {
                score += 1000;
            }
        } else {
            score -= distSq / 10;
        }

        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 2;
        }

        return score;
    }
}
