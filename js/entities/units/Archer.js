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
            score += 2000;
        } else if (enemy.type === 'villager') {
            score += 1200;
        } else if (enemy.type === 'warrior' || enemy.type === 'spearman' || enemy.type === 'cavalry') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 2000;
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

                // Intentar huir.
                const oldX = this.x;
                const oldY = this.y;

                // Usar la función de Unit para movernos, dist 0 para mover exacto
                this.moveTowardsTarget(escapeX, escapeY, deltaTime, game, 0);

                let movedSq = (this.x - oldX) * (this.x - oldX) + (this.y - oldY) * (this.y - oldY);

                // Si no nos movimos porque estamos chocando contra el terreno o límite
                if (movedSq < 0.1) {
                    // Try rotating 90 degrees to slide around obstacle
                    const newDirX = -dirY;
                    const newDirY = dirX;
                    const newEscapeX = this.x + newDirX * escapeDist;
                    const newEscapeY = this.y + newDirY * escapeDist;

                    this.moveTowardsTarget(newEscapeX, newEscapeY, deltaTime, game, 0);
                    movedSq = (this.x - oldX) * (this.x - oldX) + (this.y - oldY) * (this.y - oldY);

                    if (movedSq < 0.1) {
                        isKiting = false;
                        // Dejar que actúe normalmente (disparar sin huir)
                    }
                }

                if (isKiting) {
                    // Stutter Stepping Perfection
                    // Shoot while kiting if cooldown is ready and target is in range
                    if (this.attackCooldown <= 0 && distSq <= this.attackRangeSq) {
                        this.tryAttack(this.attackTarget, deltaTime, game);
                    } else if (this.attackCooldown > 0) {
                        this.attackCooldown -= deltaTime;
                    }

                    // Desvincular temporalmente el objetivo para que super.update() no nos devuelva hacia el enemigo
                    const tempTarget = this.attackTarget;
                    const tempExplicit = this.explicitTarget;
                    this.attackTarget = null;
                    this.explicitTarget = false;

                    super.update(deltaTime, game);

                    // Restaurar objetivo
                    this.attackTarget = tempTarget;
                    this.explicitTarget = tempExplicit;
                }
            }
        }

        // Si no estamos kiteando (ya sea porque no hace falta o porque estábamos acorralados)
        // usamos la lógica estándar de la unidad.
        if (!isKiting) {
            super.update(deltaTime, game);
        }
    }
}
