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
            score += 600;
        } else if (enemy.type === 'warrior') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 2000; // Stronger penalty so they don't attack buildings if troops are around
        }

        // Penalización HEAVY por distancia para evitar perseguir infinitamente a arqueros que kittean
        // Si la distancia es muy grande, ignorarlo a menos que no haya otra opción
        score -= distSq / 50;

        // If HP is low, avoid retreating for now, just fight to the death as warriors do,
        // or prioritize closer targets even more to avoid moving while dying
        if (this.hp < this.maxHp * 0.2) {
            score -= distSq / 10;
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
        this.canAttack = true;
    }
}
