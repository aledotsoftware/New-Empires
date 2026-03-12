import { Unit } from '../Unit.js';

/**
 * Archer - Arquero
 * Unidad de combate a distancia
 */
export class Archer extends Unit {
    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;

        // IA de Unidades: Mejora de decisiones para Arquero
        // Los arqueros deben priorizar a otros arqueros (counter-fire)
        // o a unidades frágiles. Nunca edificios si hay tropas cerca.
        if (enemy.type === 'archer') {
            score += 1200;
        } else if (enemy.type === 'villager') {
            score += 800;
        } else if (enemy.type === 'warrior') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 1000;
        }

        // Penalización ligera por distancia (pueden disparar de lejos)
        score -= distSq / 1000;

        return score;
    }

    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/archer.png';
        this.name = 'Arquero';
        this.type = 'archer';
        this.maxHp = 60;
        this.hp = 60;
        this.attackDamage = 8;
        this.attackSpeed = 1.5;
        this.attackRange = 100;
        this.canAttack = true;
    }

    update(deltaTime, game) {
        // Lógica de Alcance: Kiting (Hit & Run)
        // Asegura que los arqueros mantengan su distancia máxima de ataque independientemente del terreno
        let isKiting = false;

        if (this.attackTarget && !this.attackTarget.isDead) {
            const dx = this.x - this.attackTarget.x;
            const dy = this.y - this.attackTarget.y;
            const distSq = dx * dx + dy * dy;

            // Mantenemos distancia a un ~90% de nuestra attackRange para tener un margen seguro de disparo
            const minKiteDistSq = this.attackRangeSq * 0.81;

            // Verificamos si podemos movernos (no estamos estuneados, etc.)
            // En este motor, el Unit base maneja todo en update()
            // Si está muy cerca y no es un objetivo de recolección/movimiento forzado:
            if (distSq < minKiteDistSq && this.targetX === null) {
                isKiting = true;

                // Calcular vector de huida
                const dist = Math.sqrt(distSq) || 1;
                const dirX = dx / dist;
                const dirY = dy / dist;

                // Mover en la dirección opuesta al enemigo
                const escapeDist = 50;
                const escapeX = this.x + dirX * escapeDist;
                const escapeY = this.y + dirY * escapeDist;

                // Usar la función de Unit para movernos, dist 0 para mover exacto
                this.moveTowardsTarget(escapeX, escapeY, deltaTime, game, 0);

                // Mientras huimos, no atacamos (stutter stepping: huye, se detiene, dispara)
                if (this.attackCooldown > 0) {
                    this.attackCooldown -= deltaTime;
                }

                // Desvincular temporalmente el objetivo para que super.update() no nos devuelva hacia el enemigo
                const tempTarget = this.attackTarget;
                this.attackTarget = null;

                super.update(deltaTime, game);

                // Restaurar objetivo
                this.attackTarget = tempTarget;
            }
        }

        if (!isKiting) {
            super.update(deltaTime, game);
        }
    }
}
