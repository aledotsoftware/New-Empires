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
                // BOLT OPTIMIZATION: Pass threshold (30^2 = 900) to moveTowardsTarget directly.
                // Avoids calculating distance locally. moveTowardsTarget calculates it once.
                if (this.moveTowardsTarget(this.currentResourceNode.x, this.currentResourceNode.y, deltaTime, game, 900)) {
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
                // BOLT OPTIMIZATION: Pass dynamic threshold to moveTowardsTarget
                const minDist = this.dropOffTarget.size + 10;

                if (this.moveTowardsTarget(this.dropOffTarget.x, this.dropOffTarget.y, deltaTime, game, minDist * minDist)) {
                    game.resources[this.carryType] += this.carryAmount;

                    // Palette: Visual Feedback for Deposit
                    if (game.particleSystem) {
                        const amount = Math.floor(this.carryAmount);
                        let color = '#fff';
                        let icon = '';
                        switch (this.carryType) {
                            case 'wood': color = '#8b5a2b'; icon = '🌲'; break;
                            case 'food': color = '#7cb342'; icon = '🌾'; break;
                            case 'gold': color = '#ffc107'; icon = '💰'; break;
                            case 'stone': color = '#78909c'; icon = '🪨'; break;
                        }
                        game.particleSystem.createFloatingText(this.x, this.y - 20, `+${amount} ${icon}`, color);
                    }

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
                // BOLT OPTIMIZATION: Pass dynamic threshold to moveTowardsTarget
                const minBuildDist = this.buildTarget.size + 20;

                if (this.moveTowardsTarget(this.buildTarget.x, this.buildTarget.y, deltaTime, game, minBuildDist * minBuildDist)) {
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
                        // BOLT OPTIMIZATION: Stop moving if already in attack range
                        // Avoids unnecessary collision checks and pushing against target
                        this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime, game, this.attackRangeSq);
                        this.tryAttack(this.attackTarget, deltaTime, game);
                    }
                } else {
                    this.state = 'IDLE';
                }
                break;
        }
    }

    render(ctx, camera, viewWidth, viewHeight, drawHp, drawBackground = true) {
        super.render(ctx, camera, viewWidth, viewHeight, drawHp, drawBackground);

        // Palette: Draw Idle Indicator (Zzz)
        if (this.state === 'IDLE' && this.team === 'player') {
            const screenX = this._screenX;
            const screenY = this._screenY;

            ctx.save(); // Save context to prevent leakage

            // BOLT OPTIMIZATION: Use cached game.renderTime instead of Date.now()
            // Eliminates 1 system call per idle villager per frame
            const time = (typeof game !== 'undefined' && game && game.renderTime) ? game.renderTime : Date.now();
            const offsetY = Math.sin(time / 200) * 3; // +/- 3px

            // Position above head (adjust if carrying resource)
            let iconY = screenY - this.size - 25 + offsetY;

            // If somehow carrying and idle (rare/stuck), shift up
            if (this.carryAmount > 0 && this.carryType) {
                iconY -= 18;
            }

            const iconSize = 16;

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.arc(screenX, iconY + iconSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('💤', screenX, iconY + iconSize / 2 + 1);

            ctx.restore(); // Restore context
        }

        // Palette: Draw carried resource icon
        if (this.carryAmount > 0 && this.carryType) {
            // BOLT OPTIMIZATION: Use cached screen coordinates
            const screenX = this._screenX;
            const screenY = this._screenY;

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

        // BOLT OPTIMIZATION: Use cached dropOffPoints to avoid iterating all buildings
        // Reduces O(N_buildings) to O(N_dropOffs) which is significantly faster (~20-50x)
        const targets = game.dropOffPoints;
        const len = targets.length;

        for (let i = 0; i < len; i++) {
            const b = targets[i];
            // Filter inline
            if (b.team === this.team) {
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
