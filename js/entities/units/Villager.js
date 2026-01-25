import { Unit } from '../Unit.js';
import { CONFIG } from '../../core/constants.js';
import { assetLoader } from '../../managers/AssetLoader.js';

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

                        // BOLT OPTIMIZATION: Use local CONFIG (imported) instead of global check.
                        // Kept Math.min for readability as V8 optimizes it well.
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

    render(ctx, camera, viewWidth, viewHeight, drawHp) {
        super.render(ctx, camera, viewWidth, viewHeight, drawHp);

        // Palette: Draw carried resource icon
        if (this.carryAmount > 0 && this.carryType) {
            // BOLT OPTIMIZATION: Truncate to integer
            const screenX = (this.x - camera.x) | 0;
            const screenY = (this.y - camera.y) | 0;

            // Simple visibility check
            if (screenX < -20 || screenX > viewWidth + 20 || screenY < -20 || screenY > viewHeight + 20) return;

            const iconSize = 14;
            // Position above head. Entity.js size=20 default, rect is 40x40 centered at xy?
            // Entity.js: ctx.fillRect(screenX - this.size, screenY - this.size, ...)
            // So top is screenY - size.
            // HP bar is at screenY - size - 10.
            // We want it above HP bar. HP bar height is 4.
            // Let's put it at screenY - size - 25.
            const iconY = screenY - this.size - 25;

            // Background for readability
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.arc(screenX, iconY + iconSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            const img = assetLoader.getImage(this.carryType);
            if (img && img.complete) {
                ctx.drawImage(img, screenX - iconSize / 2, iconY, iconSize, iconSize);
            } else {
                // Fallback colors
                const colors = { wood: '#8b5a2b', food: '#7cb342', gold: '#ffc107', stone: '#78909c' };
                ctx.fillStyle = colors[this.carryType] || '#fff';
                ctx.beginPath();
                ctx.arc(screenX, iconY + iconSize / 2, iconSize / 2 - 1, 0, Math.PI * 2);
                ctx.fill();
            }
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
        // BOLT OPTIMIZATION: Use cached dropOffPoints (M << N)
        const candidates = game.dropOffPoints || game.buildings;
        const len = candidates.length;

        for (let i = 0; i < len; i++) {
            const b = candidates[i];
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
