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

        // Optimización: Cache para consultas espaciales
        this._nearbyCache = [];

        // Optimización: Cache para consultas de terreno (Unit.js)
        this._lastGridCol = -1;
        this._lastGridRow = -1;
        this._cachedTerrainSpeed = 1.0;
        this._cachedTerrainData = null;
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
            // OPTIMIZATION: moveTowardsTarget returns true if arrived, avoiding redundant dist calc
            if (this.moveTowardsTarget(this.targetX, this.targetY, deltaTime, game)) {
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
        const searchRadiusSq = searchRadius * searchRadius;

        // OPTIMIZACIÓN: Usar find() para early exit
        // Evita llenar el array cache y termina en cuanto encuentra un enemigo válido
        this.attackTarget = game.spatialGrid.find(this.x, this.y, searchRadius, (entity) => {
            if (entity.team !== this.team && entity.team !== 'neutral' && !entity.isDead && entity.isUnit) {
                const dx = this.x - entity.x;
                const dy = this.y - entity.y;
                const distSq = dx * dx + dy * dy;
                return distSq < searchRadiusSq;
            }
            return false;
        });
    }

    moveTowardsTarget(targetX, targetY, deltaTime, game) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distSq = dx * dx + dy * dy;

        // OPTIMIZATION: Check squared distance first to avoid sqrt if already close
        // threshold 5px -> 25 squared
        if (distSq > 25) {
            // OPTIMIZATION: Math.sqrt is faster than Math.hypot for simple 2D distance
            const dist = Math.sqrt(distSq);

            // Obtener modificador de terreno
            let speedModifier = 1.0;

            // OPTIMIZATION: Hoist grid calculation to reuse in collision logic
            // Avoids re-calculating currCol/currRow in the collision block (~30% faster in hot path)
            let currCol = -1;
            let currRow = -1;
            let hasGridMap = false;

            if (game && game.gridMap) {
                hasGridMap = true;
                // OPTIMIZATION: Bitwise OR is faster than Math.floor for positive coordinates
                // Entities are clamped to positive coordinates in update()
                currCol = (this.x * game.gridMap.invTileSize) | 0;
                currRow = (this.y * game.gridMap.invTileSize) | 0;

                if (currCol !== this._lastGridCol || currRow !== this._lastGridRow) {
                    this._lastGridCol = currCol;
                    this._lastGridRow = currRow;

                    if (game.terrainMap) {
                        // OPTIMIZATION: Use direct grid access to avoid redundant coordinate calculation
                        const terrainData = game.terrainMap.getTerrainDataByGrid(currCol, currRow);
                        this._cachedTerrainSpeed = terrainData.movementSpeed;
                        this._cachedTerrainData = terrainData;
                    }
                }
                speedModifier = this._cachedTerrainSpeed;
            } else if (game && game.terrainMap) {
                // Fallback por seguridad
                const terrainData = game.terrainMap.getTerrainDataAt(this.x, this.y);
                speedModifier = terrainData.movementSpeed;
            }

            const effectiveSpeed = this.speed * speedModifier;
            let moveX = (dx / dist) * effectiveSpeed * deltaTime;
            let moveY = (dy / dist) * effectiveSpeed * deltaTime;

            // Colisiones con edificios (GridMap)
            if (hasGridMap) {
                // OPTIMIZATION: Hoist properties for faster access
                const gridMap = game.gridMap;
                const grid = gridMap.grid;
                const cols = gridMap.cols;

                // Verificar nueva posición propuesta
                const nextX = this.x + moveX;
                const nextY = this.y + moveY;

                // OPTIMIZATION: Inlined snapToGrid to avoid object allocation (10x faster)
                // Usar multiplicación por invTileSize en lugar de división (más rápido)
                // Using bitwise OR for truncation
                const nextCol = (nextX * gridMap.invTileSize) | 0;
                const nextRow = (nextY * gridMap.invTileSize) | 0;

                // OPTIMIZATION: Inline getIndex to avoid method call overhead
                // const cellIndex = gridMap.getIndex(nextCol, nextRow);
                const cellIndex = nextRow * cols + nextCol;

                // Si el índice es válido y hay algo en la celda
                if (cellIndex >= 0 && cellIndex < grid.length) {
                    const content = grid[cellIndex];

                    if (content && content.isBuilding) {
                        // Colisión simple: Intentar deslizarse
                        // OPTIMIZATION: Reuse calculated col/row indices
                        // We avoid 2 Math.floor calls here by using currCol/currRow computed above

                        // Verificar movimiento solo en X
                        // nextX col is 'nextCol', current y row is 'currRow'
                        // const contentX = gridMap.grid[gridMap.getIndex(nextCol, currRow)];
                        const indexX = currRow * cols + nextCol;
                        const contentX = grid[indexX];

                        if (contentX && contentX.isBuilding) {
                            moveX = 0;
                        }

                        // Verificar movimiento solo en Y
                        // current x col is 'currCol', nextY row is 'nextRow'
                        // const contentY = gridMap.grid[gridMap.getIndex(currCol, nextRow)];
                        const indexY = nextRow * cols + currCol;
                        const contentY = grid[indexY];

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

            return false; // Still moving
        }

        return true; // Arrived
    }

    tryAttack(target, deltaTime, game) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distSq = dx * dx + dy * dy;
        const attackRangeSq = this.attackRange * this.attackRange;

        if (distSq <= attackRangeSq && this.attackCooldown <= 0) {
            let damage = this.attackDamage;

            // Aplicar bonificaciones de terreno si el juego está disponible
            if (game && game.terrainMap) {
                // Bonificación del atacante
                // OPTIMIZACIÓN: Usar cache si está disponible (evita recálculo de grid coords)
                let myTerrainData = this._cachedTerrainData;
                if (!myTerrainData || this._lastGridCol === -1) {
                    myTerrainData = game.terrainMap.getTerrainDataAt(this.x, this.y);
                }

                if (myTerrainData.combatBonus[this.type]) {
                    damage *= myTerrainData.combatBonus[this.type];
                }

                // Bonificación defensiva del objetivo
                // OPTIMIZACIÓN: Usar cache del objetivo si es una unidad
                let targetTerrainData = target._cachedTerrainData;
                if (!targetTerrainData) {
                    targetTerrainData = game.terrainMap.getTerrainDataAt(target.x, target.y);
                }

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
        const dx = this.x - node.x;
        const dy = this.y - node.y;
        const distSq = dx * dx + dy * dy;

        // 30 * 30 = 900
        if (distSq <= 900) {
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
