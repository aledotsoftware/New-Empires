import { Unit } from '../Unit.js';

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
                    this.moveTowardsTarget(this.targetX, this.targetY, deltaTime);
                    if (Math.hypot(this.x - this.targetX, this.y - this.targetY) < 5) {
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
                const distRes = Math.hypot(this.x - this.currentResourceNode.x, this.y - this.currentResourceNode.y);
                if (distRes > 30) {
                    this.moveTowardsTarget(this.currentResourceNode.x, this.currentResourceNode.y, deltaTime);
                } else {
                    this.gatherTimer += deltaTime;
                    if (this.gatherTimer >= 1.0) {
                        this.gatherTimer = 0;
                        // CONFIG es una variable global
                        if (typeof CONFIG !== 'undefined') {
                            const rate = CONFIG.GATHER_RATES[this.currentResourceNode.type];
                            const amount = Math.min(rate, this.currentResourceNode.amount, this.maxCarry - this.carryAmount);
                            this.currentResourceNode.amount -= amount;
                            this.carryAmount += amount;
                            this.carryType = this.currentResourceNode.type;
                            if (this.carryAmount >= this.maxCarry) this.findDropOffAndGo(game);
                        }
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
                const distDrop = Math.hypot(this.x - this.dropOffTarget.x, this.y - this.dropOffTarget.y);
                if (distDrop > this.dropOffTarget.size + 10) {
                    this.moveTowardsTarget(this.dropOffTarget.x, this.dropOffTarget.y, deltaTime);
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
                const distBuild = Math.hypot(this.x - this.buildTarget.x, this.y - this.buildTarget.y);
                if (distBuild > this.buildTarget.size + 20) {
                    this.moveTowardsTarget(this.buildTarget.x, this.buildTarget.y, deltaTime);
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
                        this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime);
                        this.tryAttack(this.attackTarget, deltaTime);
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
        let minDist = Infinity;
        const dropOffs = game.buildings.filter(b => (b.type === 'townCenter' || b.type === 'storage') && b.team === this.team);
        for (let b of dropOffs) {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = b;
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
