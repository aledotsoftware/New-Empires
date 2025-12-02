import { Entity } from './Entity.js';

/**
 * Unit - Clase base para unidades móviles
 * Maneja movimiento, combate, recolección y IA básica
 */
export class Unit extends Entity {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 32;
        this.isUnit = true;
        this.speed = 50;
        this.targetX = null;
        this.targetY = null;
        this.attackTarget = null;
        this.gatherTarget = null;
        this.attackDamage = 5;
        this.attackSpeed = 1;
        this.attackRange = 50;
        this.attackCooldown = 0;
        this.canAttack = false;
        this.canGather = false;

        this.aiTimer = Math.random() * 0.5;
        this.aiCheckInterval = 0.5;
    }

    update(deltaTime, game) {
        this.aiTimer -= deltaTime;

        if (!this.attackTarget && this.canAttack && this.aiTimer <= 0) {
            this.findNearbyEnemy(game);
            this.aiTimer = this.aiCheckInterval;
        }

        if (this.attackTarget) {
            if (this.attackTarget.isDead) {
                this.attackTarget = null;
            } else {
                this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime, game);
                this.tryAttack(this.attackTarget, deltaTime, game);
            }
        }
        else if (this.gatherTarget && this.canGather) {
            if (this.gatherTarget.amount <= 0) {
                this.gatherTarget = null;
            } else {
                this.moveTowardsTarget(this.gatherTarget.x, this.gatherTarget.y, deltaTime, game);
                this.tryGather(this.gatherTarget, deltaTime, game);
            }
        }
        else if (this.targetX !== null) {
            this.moveTowardsTarget(this.targetX, this.targetY, deltaTime, game);
            const dist = Math.hypot(this.x - this.targetX, this.y - this.targetY);
            if (dist < 10) {
                this.targetX = null;
                this.targetY = null;
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }

    findNearbyEnemy(game) {
        const searchRadius = 200;

        // OPTIMIZACIÓN: Usar Spatial Grid
        const nearbyEntities = game.spatialGrid.query(this.x, this.y, searchRadius);

        for (let entity of nearbyEntities) {
            if (entity.team !== this.team && entity.team !== 'neutral' && !entity.isDead && entity.isUnit) {
                const dist = Math.hypot(this.x - entity.x, this.y - entity.y);
                if (dist < searchRadius) {
                    this.attackTarget = entity;
                    break;
                }
            }
        }
    }

    moveTowardsTarget(targetX, targetY, deltaTime, game) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            // Obtener modificador de terreno
            let speedModifier = 1.0;
            if (game && game.terrainMap) {
                const terrain = game.terrainMap.getTerrainAt(this.x, this.y);
                const terrainData = game.terrainMap.getTerrainData(terrain);
                speedModifier = terrainData.movementSpeed;
            }

            const effectiveSpeed = this.speed * speedModifier;
            let moveX = (dx / dist) * effectiveSpeed * deltaTime;
            let moveY = (dy / dist) * effectiveSpeed * deltaTime;

            // Colisiones con edificios (GridMap)
            if (game && game.gridMap) {
                // Verificar nueva posición propuesta
                const nextX = this.x + moveX;
                const nextY = this.y + moveY;

                const snap = game.gridMap.snapToGrid(nextX, nextY);
                const cellIndex = game.gridMap.getIndex(snap.col, snap.row);

                // Si el índice es válido y hay algo en la celda
                if (cellIndex >= 0 && cellIndex < game.gridMap.grid.length) {
                    const content = game.gridMap.grid[cellIndex];

                    if (content && content.isBuilding) {
                        // Colisión simple: Intentar deslizarse
                        // Verificar movimiento solo en X
                        const snapX = game.gridMap.snapToGrid(this.x + moveX, this.y);
                        const contentX = game.gridMap.grid[game.gridMap.getIndex(snapX.col, snapX.row)];
                        if (contentX && contentX.isBuilding) {
                            moveX = 0;
                        }

                        // Verificar movimiento solo en Y
                        const snapY = game.gridMap.snapToGrid(this.x, this.y + moveY);
                        const contentY = game.gridMap.grid[game.gridMap.getIndex(snapY.col, snapY.row)];
                        if (contentY && contentY.isBuilding) {
                            moveY = 0;
                        }
                    }
                }
            }

            this.x += moveX;
            this.y += moveY;

            // CONFIG es una variable global
            if (typeof CONFIG !== 'undefined') {
                this.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH, this.x));
                this.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT, this.y));
            }
        }
    }

    tryAttack(target, deltaTime, game) {
        const dist = Math.hypot(this.x - target.x, this.y - target.y);

        if (dist <= this.attackRange && this.attackCooldown <= 0) {
            let damage = this.attackDamage;

            // Aplicar bonificaciones de terreno si el juego está disponible
            if (game && game.terrainMap) {
                // Bonificación del atacante
                const myTerrain = game.terrainMap.getTerrainAt(this.x, this.y);
                const myTerrainData = game.terrainMap.getTerrainData(myTerrain);

                if (myTerrainData.combatBonus[this.type]) {
                    damage *= myTerrainData.combatBonus[this.type];
                }

                // Bonificación defensiva del objetivo
                const targetTerrain = game.terrainMap.getTerrainAt(target.x, target.y);
                const targetTerrainData = game.terrainMap.getTerrainData(targetTerrain);

                if (targetTerrainData.combatBonus.defense) {
                    damage /= targetTerrainData.combatBonus.defense;
                }

                // Bonificación defensiva específica contra tipo de unidad (ej. arqueros en bosque)
                if (targetTerrainData.combatBonus[target.type]) {
                    // Si el terreno da bonificación al tipo de unidad defensora, reduce el daño recibido
                    // Nota: Esto asume que el bonus en TERRAIN_TYPES es genérico. 
                    // Para simplificar, usaremos la lógica de defensa general o específica si es defensa.
                    // Pero según la config: archer: 1.1 en bosque es defensa.
                    // Vamos a interpretar los valores en combatBonus como multiplicadores de fuerza.
                    // Si es defensa, reduce daño.
                }
            }

            target.takeDamage(damage);
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    tryGather(node, deltaTime, game) {
        const dist = Math.hypot(this.x - node.x, this.y - node.y);

        if (dist <= 30) {
            // CONFIG es una variable global
            if (typeof CONFIG !== 'undefined') {
                const gatherAmount = CONFIG.GATHER_RATES[node.type] * deltaTime;
                const actualGather = Math.min(gatherAmount, node.amount);

                node.amount -= actualGather;
                game.resources[node.type] += actualGather;
            }
        }
    }
}
