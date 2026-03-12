import { Unit } from '../Unit.js';

/**
 * Warrior - Guerrero
 * Unidad de combate cuerpo a cuerpo
 */
export class Warrior extends Unit {
    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        // IA de Unidades: Mejora de decisiones para Guerrero (Cuerpo a cuerpo)
        // Priorizar enemigos vulnerables o de asedio
        if (enemy.type === 'archer') {
            score += 800;
        } else if (enemy.type === 'villager') {
            score += 600;
        } else if (enemy.type === 'warrior') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 1000;
        }

        // Penalización HEAVY por distancia para evitar perseguir infinitamente a arqueros que kittean
        // Si la distancia es muy grande, ignorarlo a menos que no haya otra opción
        score -= distSq / 50;

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
