import { Unit } from '../Unit.js';

/**
 * Warrior - Guerrero
 * Unidad de combate cuerpo a cuerpo
 */
export class Warrior extends Unit {
    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        // IA de Unidades: Mejora de decisiones para Guerrero (Cuerpo a cuerpo)
        // Priorizar enemigos vulnerables o de asedio fuertemente
        if (enemy.type === 'archer') {
            score += 3000; // Increase priority of archers significantly over anything else
        } else if (enemy.type === 'villager') {
            score += 1500;
        } else if (enemy.type === 'warrior' || enemy.type === 'spearman' || enemy.type === 'cavalry') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 3000; // Stronger penalty so they don't attack buildings if troops are around
        }

        // Distance penalty to prevent endless chasing of kiting units
        // and force switching to closer targets if the current one runs away.
        if (this.attackTarget === enemy) {
            // Drop Aggro aggressively if the target moves out of immediate attack range
            if (distSq > this.attackRangeSq * 1.5) {
                score -= distSq / 2; // Strong penalty to force target switch
            } else {
                score += 1000; // Stick to target if it's right in front of us
            }
        } else {
            score -= distSq / 10;
        }

        // Fight to the death if low HP, stick to closest things
        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 2;
        }

        return score;
    }

    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/warrior.png';
        this.name = 'Guerrero';
        this.type = 'warrior';
        this.maxHp = 100;
        this.hp = 100;
        this.attackDamage = 10;
        this.attackSpeed = 1.2;
        this.attackRange = 80; // Aumentado ligeramente para ensanchar el frente de combate y reducir atascos
        this.canAttack = true;
    }
}
