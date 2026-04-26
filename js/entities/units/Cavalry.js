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
        this.attackRange = 75; // Increased slightly to reduce frontline traffic jams
        this.speed = 80;
        this.canAttack = true;
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        if (enemy.type === 'archer') {
            score += 4000; // Fast units should hunt archers
        } else if (enemy.type === 'villager') {
            score += 1500;
        } else if (enemy.type === 'spearman') {
            score -= 3000; // Severely avoid spearmen!
        } else if (enemy.isBuilding) {
            score -= 2000;
        }

        // Distance penalty to prevent endless chasing
        if (this.attackTarget === enemy) {
            // Drop Aggro aggressively if the target moves out of immediate attack range
            if (distSq > this.attackRangeSq * 1.5) {
                score -= distSq / 5; // Less severe penalty for cavalry since they are fast
            } else {
                score += 1000;
            }
        } else {
            score -= distSq / 10;
        }

        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 5;
        }

        return score;
    }
}
