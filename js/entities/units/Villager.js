import { Unit } from '../Unit.js';
import { CONFIG } from '../../core/constants.js';

/**
 * Villager - Aldeano
 * Unidad de trabajo que puede recolectar recursos y construir edificios
 */
export class Villager extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/villager.png';
        this.name = 'Aldeano';
        this.type = 'villager';
        this.maxHp = 50;
        this.hp = 50;
        this.attackDamage = 3;
        this.canAttack = true;
        this.canGather = true;

        // Estado y Carga
        this.state = 'IDLE';
        this.carryAmount = 0;
        this.carryType = null;
        this.maxCarry = 10;
        this.gatherTimer = 0;

        // Objetivos
        this.currentResourceNode = null;
        this.dropOffTarget = null;
        this.buildTarget = null;

        // Temporizador para sonidos de trabajo
        this.workTimer = 0;
    }

    update(deltaTime, game) {
        this.aiTimer -= deltaTime;

        switch (this.state) {
            case 'IDLE':
                if (this.carryAmount > 0) this.findDropOffAndGo(game);
                if (this.aiTimer <= 0) {
                    this.findNearbyEnemy(game);
                    this.aiTimer = this.aiCheckInterval;
                }
                break;

            case 'MOVING':
                if (this.targetX !== null) {
                    // OPTIMIZATION: Use return value of moveTowardsTarget to avoid redundant sqrt check
                    // Also pass 'game' to enable potential grid optimizations in Unit.js
                    if (this.moveTowardsTarget(this.targetX, this.targetY, deltaTime, game)) {
                        this.targetX = null;
                        this.state = 'IDLE';
                    }
                }
                break;

            case 'GATHERING':
                if (!this.currentResourceNode || this.currentResourceNode.amount <= 0) {
                    this.state = 'IDLE';
                    this.currentResourceNode = null;
                    break;
                }
                // OPTIMIZATION: Use squared distance check to avoid Math.hypot (sqrt)
                // 30^2 = 900
                const dxRes = this.x - this.currentResourceNode.x;
                const dyRes = this.y - this.currentResourceNode.y;
                const distResSq = dxRes * dxRes + dyRes * dyRes;

                if (distResSq > 900) {
                    this.moveTowardsTarget(this.currentResourceNode.x, this.currentResourceNode.y, deltaTime, game);
                } else {
                    this.gatherTimer += deltaTime;
                    if (this.gatherTimer >= 1.0) {
                        this.gatherTimer = 0;
                        // OPTIMIZATION: Access imported CONFIG directly (avoid global lookup and type check)
                        const rate = CONFIG.GATHER_RATES[this.currentResourceNode.type];
                        const amount = Math.min(rate, this.currentResourceNode.amount, this.maxCarry - this.carryAmount);
                        this.currentResourceNode.amount -= amount;
                        this.carryAmount += amount;
                        this.carryType = this.currentResourceNode.type;
                        if (this.carryAmount >= this.maxCarry) this.findDropOffAndGo(game);
                    }
                }
                break;

            case 'CARRYING':
                if (!this.dropOffTarget) {
                    this.findDropOffAndGo(game);
                    if (!this.dropOffTarget) {
                        this.state = 'IDLE';
                        break;
                    }
                }
                // OPTIMIZATION: Use squared distance check
                const dxDrop = this.x - this.dropOffTarget.x;
                const dyDrop = this.y - this.dropOffTarget.y;
                const distDropSq = dxDrop * dxDrop + dyDrop * dyDrop;
                const minDist = this.dropOffTarget.size + 10;

                if (distDropSq > minDist * minDist) {
                    this.moveTowardsTarget(this.dropOffTarget.x, this.dropOffTarget.y, deltaTime, game);
                } else {
                    game.resources[this.carryType] += this.carryAmount;
                    console.log(`💰 Depositado: ${Math.floor(this.carryAmount)} ${this.carryType}`);
                    this.carryAmount = 0;
                    this.carryType = null;
                    if (this.currentResourceNode && this.currentResourceNode.amount > 0) {
                        this.state = 'GATHERING';
                    } else {
                        this.state = 'IDLE';
                    }
                }
                break;

            case 'BUILDING':
                if (!this.buildTarget || !this.buildTarget.isUnderConstruction) {
                    this.state = 'IDLE';
                    this.buildTarget = null;
                    break;
                }
                // OPTIMIZATION: Use squared distance check
                const dxBuild = this.x - this.buildTarget.x;
                const dyBuild = this.y - this.buildTarget.y;
                const distBuildSq = dxBuild * dxBuild + dyBuild * dyBuild;
                const minBuildDist = this.buildTarget.size + 20;

                if (distBuildSq > minBuildDist * minBuildDist) {
                    this.moveTowardsTarget(this.buildTarget.x, this.buildTarget.y, deltaTime, game);
                } else {
                    let buildSpeed = 50;
                    // civilizationManager es una variable global
                    if (game && game.civilizationId && typeof civilizationManager !== 'undefined') {
                        buildSpeed *= civilizationManager.getBuildSpeed(game.civilizationId);
                    }
                    this.buildTarget.hp += buildSpeed * deltaTime;

                    // Sonido de trabajo periódico
                    this.workTimer += deltaTime;
                    if (this.workTimer >= 1.5) { // Cada 1.5 segundos
                        this.workTimer = 0;
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('buildWork');
                        }
                    }

                    if (this.buildTarget.hp >= this.buildTarget.constructionMaxHp) {
                        this.buildTarget.hp = this.buildTarget.constructionMaxHp;
                        this.buildTarget.isUnderConstruction = false;
                        this.state = 'IDLE';
                        this.buildTarget = null;

                        // Sonido de finalización
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('buildComplete');
                        }

                        if (game) game.showNotification("Edificio completado", "success");
                    }
                }
                break;

            case 'ATTACKING':
                if (this.attackTarget) {
                    if (this.attackTarget.isDead) {
                        this.attackTarget = null;
                        this.state = 'IDLE';
                    } else {
                        this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime, game);
                        this.tryAttack(this.attackTarget, deltaTime, game);
                    }
                } else {
                    this.state = 'IDLE';
                }
                break;
        }
    }

    tryGather(node, deltaTime, game) {
        if (this.state !== 'GATHERING' && this.state !== 'CARRYING') {
            this.state = 'GATHERING';
            this.currentResourceNode = node;
            this.targetX = null;
        }
    }

    findDropOffAndGo(game) {
        let nearest = null;
        let minDistSq = Infinity;

        // OPTIMIZATION: Avoid Array.filter allocation and use manual loop with squared distance
        // Reduces garbage collection pressure and cpu cycles by avoiding array creation and sqrt
        const buildings = game.buildings;
        const len = buildings.length;

        for (let i = 0; i < len; i++) {
            const b = buildings[i];
            // Filter inline
            if ((b.type === 'townCenter' || b.type === 'storage') && b.team === this.team) {
                const dx = this.x - b.x;
                const dy = this.y - b.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearest = b;
                }
            }
        }

        if (nearest) {
            this.state = 'CARRYING';
            this.dropOffTarget = nearest;
        } else {
            console.warn("No hay depósito disponible");
        }
    }
}
