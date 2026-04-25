import { Unit } from '../Unit.js';

/**
 * Priest - Sacerdote
 * Unidad de soporte que cura (y potencialmente convierte)
 */
export class Priest extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/villager.png'; // Placeholder base_units
        this.name = 'Sacerdote';
        this.type = 'priest';
        this.maxHp = 50;
        this.hp = 50;
        this.attackDamage = 0; // Heal amount instead of attack
        this.healAmount = 5;
        this.attackSpeed = 1.0;
        this.attackRange = 50;
        this.speed = 40;
        this.canAttack = false; // Cannot attack enemies
        this.canHeal = true;
    }

    // Los sacerdotes evalúan aliados dañados en lugar de enemigos
    evaluateTargetScore(ally, baseScore, distSq) {
        if (ally.team !== this.team || ally.hp >= ally.maxHp || ally.isBuilding) {
            return -Infinity;
        }

        let score = baseScore;

        // Priorizar unidades con poca vida
        const missingHp = ally.maxHp - ally.hp;
        score += missingHp * 10;

        score -= distSq / 50;

        return score;
    }

    // Sobreescribimos el scan para buscar aliados heridos
    scanForEnemies(game) {
        if (!game || !game.units) return;

        let bestTarget = null;
        let bestScore = -Infinity;

        const maxAggroDistSq = 300 * 300;

        // Buscar aliados heridos en lugar de enemigos
        for (let i = 0; i < game.units.length; i++) {
            const ally = game.units[i];

            if (ally === this || ally.isDead || ally.team !== this.team) continue;
            if (ally.hp >= ally.maxHp) continue;

            const dx = this.x - ally.x;
            const dy = this.y - ally.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxAggroDistSq) {
                const score = this.evaluateTargetScore(ally, 1000, distSq);
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = ally;
                }
            }
        }

        if (bestTarget && (!this.attackTarget || bestScore > this.evaluateTargetScore(this.attackTarget, 1000, 0))) {
            this.attackTarget = bestTarget;
        }
    }

    // Sobreescribimos tryAttack para curar
    tryAttack(target, deltaTime, game) {
        if (target.team !== this.team) {
            this.attackTarget = null; // Ignorar enemigos si fueron targeteados por error
            return;
        }

        if (target.hp >= target.maxHp) {
            this.attackTarget = null; // Ya curado
            return;
        }

        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= this.attackRangeSq && this.attackCooldown <= 0) {
            let actualHeal = this.healAmount;
            if (game && game.modifiers && game.modifiers.healingSpeed) {
                actualHeal = Math.floor(actualHeal * game.modifiers.healingSpeed);
            }

            target.hp += actualHeal;
            if (target.hp > target.maxHp) target.hp = target.maxHp;

            this.attackCooldown = 1 / this.attackSpeed;

            // Palette: Visual Feedback for Heal
            if (game && game.particleSystem) {
                game.particleSystem.createFloatingText(target.x, target.y - target.size / 2, `+${actualHeal}`, '#4caf50');
            }
        }
    }
}
