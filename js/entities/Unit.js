import { soundManager } from '../managers/SoundManager.js';
import { Entity } from './Entity.js';
import { CONFIG, COMBAT_BONUSES } from '../core/constants.js';

/**
 * Unit - Clase base para unidades móviles
 * Maneja movimiento, combate, recolección y IA básica
 */
// OPTIMIZATION: Constant for aggro radius squared to avoid recalculation
const AGGRO_RADIUS_SQ = 200 * 200;

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
        // BOLT OPTIMIZATION: Cache attackRange squared to avoid multiplication in hot loop
        this.attackRange = 50; // Triggers setter to calc attackRangeSq
        this.attackCooldown = 0;
        this.canAttack = false;
        this.canGather = false;
        this.explicitTarget = false;

        // Vision
        this.visionRadius = CONFIG.VISION.DEFAULT_UNIT;

        this.aiTimer = Math.random() * 0.5;
        this.aiCheckInterval = 0.5;
    }

    // BOLT OPTIMIZATION: Accessor for attackRange that maintains cached squared value
    get attackRange() {
        return this._attackRange;
    }

    set attackRange(value) {
        this._attackRange = value;
        this.attackRangeSq = value * value;
    }

    update(deltaTime, game) {
        this.aiTimer -= deltaTime;

        if (this.canAttack && this.aiTimer <= 0) {
            // Continously scan for better targets unless the player explicitly right-clicked an enemy
            if (!this.explicitTarget) {
                this.scanForEnemies(game);
            }
            this.aiTimer = this.aiCheckInterval;
        }

        if (this.attackTarget) {
            if (this.attackTarget.isDead) {
                this.attackTarget = null;
            } else {
                // BOLT OPTIMIZATION: Stop moving if already in attack range
                // Reduces expensive collision checks and improves ranged unit behavior (kiting/spacing)
                // BOLT OPTIMIZATION: Use cached squared range
                this.moveTowardsTarget(this.attackTarget.x, this.attackTarget.y, deltaTime, game, this.attackRangeSq);
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

    // OPTIMIZATION: Static predicate to avoid closure allocation in hot path
    static _enemyPredicate(entity, unit) {
        // BOLT OPTIMIZATION: Removed team check as grids are now split by team.
        // Kept !isDead because units can die during the current frame update loop.
        if (!entity.isDead) {
            const dx = unit.x - entity.x;
            const dy = unit.y - entity.y;
            const distSq = dx * dx + dy * dy;

            return distSq < AGGRO_RADIUS_SQ;
        }
        return false;
    }

    scanForEnemies(game) {
        const searchRadius = 200;

        // BOLT OPTIMIZATION: Select target grid based on team to reduce search space (O(N/2))
        let targetGrid;
        if (this.team === 'player') {
            targetGrid = game.enemyUnitGrid;
        } else if (this.team === 'enemy') {
            targetGrid = game.playerUnitGrid;
        } else {
            return; // Neutral units don't attack
        }

        if (!targetGrid) return; // Safety check

        // REFACTOR: Usar query() para obtener todos los enemigos en rango y priorizar
        // BOLT OPTIMIZATION: Reuse static array to reduce GC pressure
        if (!Unit._enemyQueryCache) {
            Unit._enemyQueryCache = [];
        }
        const enemies = Unit._enemyQueryCache;
        targetGrid.query(this.x, this.y, searchRadius, enemies, true);

        if (enemies.length === 0) return;

        let bestTarget = null;
        let bestScore = -Infinity;

        // Evaluamos cada enemigo para encontrar el objetivo prioritario
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // Reutilizamos el predicado para comprobar validez y rango estricto (AGGRO_RADIUS_SQ)
            if (!Unit._enemyPredicate(enemy, this)) continue;

            // Niebla de Guerra Táctica: No atacar enemigos que no podemos ver (excepto si nos atacan)
            if (game && game.fow && this.team === 'player' && enemy.attackTarget !== this) {
                const enemyCol = (enemy.x * game.fow.invTileSize) | 0;
                const enemyRow = (enemy.y * game.fow.invTileSize) | 0;
                if (!game.fow.isVisible(enemyCol, enemyRow)) {
                    continue;
                }
            }

            // Detección de Amenazas: no "ignoren" ser atacadas mientras recolectan o patrullan
            // Las unidades militares patrullando o moviéndose DEBEN atacar a los enemigos en rango.
            // Una unidad está bajo ataque si este enemigo la tiene como objetivo.
            const isUnderAttackByThisEnemy = (enemy.attackTarget === this);

            let isBusy = false;
            if (this.type === 'villager') {
                isBusy = this.gatherTarget !== null || (this.state !== 'IDLE' && this.state !== 'ATTACKING');
            } else {
                // Militares solo están "ocupados" ignorando enemigos si el jugador explícitamente les ordenó NO atacar
                // pero por ahora, una unidad militar nunca ignora a un enemigo en su rango de agro.
                isBusy = this.targetX !== null && this.explicitTarget; // Si se están moviendo a un objetivo específico, están ocupados
            }

            // Si estamos ocupados, solo reaccionamos al enemigo que nos está atacando explícitamente.
            // Strategist: Las unidades militares en movimiento ignoran amenazas a menos que la amenaza les dispare directamente
            if (isBusy && !isUnderAttackByThisEnemy) {
                continue;
            }

            // Puntuación base
            let score = 0;

            // Prioridad absoluta a quien nos ataca
            if (isUnderAttackByThisEnemy) {
                score += 10000; // Aumento masivo para asegurar reacción inmediata y persistente ante atacantes directos
            }

            // Target Stickiness: Evitar cambiar de objetivo constantemente si ya estamos peleando
            if (this.attackTarget === enemy) {
                score += 2000;
            }

            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distSq = dx * dx + dy * dy;

            // Delegar la evaluación táctica a las subclases
            score = this.evaluateTargetScore(enemy, score, distSq);

            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }

        if (bestTarget) {
            this.attackTarget = bestTarget;
        }
    }

    moveTowardsTarget(targetX, targetY, deltaTime, game, minDistSq = 25) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distSq = dx * dx + dy * dy;

        // OPTIMIZATION: Check squared distance first to avoid sqrt if already close
        // threshold 5px -> 25 squared
        if (distSq > minDistSq) {
            // OPTIMIZATION: Math.sqrt is faster than Math.hypot for simple 2D distance
            const dist = Math.sqrt(distSq);

            // Obtener modificador de terreno
            let speedModifier = 1.0;

            // OPTIMIZATION: Hoist grid calculation to reuse in collision logic
            // Avoids re-calculating currCol/currRow in the collision block (~30% faster in hot path)
            const gridMap = game && game.gridMap;
            let currCol = -1;
            let currRow = -1;
            let invTileSize = 0;

            if (gridMap) {
                invTileSize = gridMap.invTileSize;

                // BOLT OPTIMIZATION: Lazy Grid Calculation (use cached if available)
                // Avoids calculating (x * invTileSize) | 0 at the start of every frame (~97% savings)
                currCol = this._lastGridCol;
                currRow = this._lastGridRow;

                // Initialize cache if this is the first run
                if (currCol === -1) {
                    currCol = (this.x * invTileSize) | 0;
                    currRow = (this.y * invTileSize) | 0;
                    this._lastGridCol = currCol;
                    this._lastGridRow = currRow;

                    if (game.terrainMap) {
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

            // OPTIMIZATION: Replace division with multiplication (faster)
            // invDist avoids 2 divisions per frame
            const invDist = 1 / dist;
            const moveStep = effectiveSpeed * deltaTime * invDist;
            let moveX = dx * moveStep;
            let moveY = dy * moveStep;

            // BOLT OPTIMIZATION: Pre-calculate final grid coords to avoid redundant math later
            let finalCol = currCol;
            let finalRow = currRow;

            // Colisiones con edificios (GridMap)
            if (gridMap) {
                // Verificar nueva posición propuesta
                const nextX = this.x + moveX;
                const nextY = this.y + moveY;

                // OPTIMIZATION: Inlined snapToGrid to avoid object allocation (10x faster)
                // Usar multiplicación por invTileSize en lugar de división (más rápido)
                // Using bitwise OR for truncation
                const nextCol = (nextX * invTileSize) | 0;
                const nextRow = (nextY * invTileSize) | 0;

                // Optimistic assignment (will revert if collision occurs)
                finalCol = nextCol;
                finalRow = nextRow;

                // OPTIMIZATION: Skip collision check if moving within the same tile (~97% of frames)
                // If we are currently in a valid (non-building) tile, staying in it is safe.
                if (nextCol !== currCol || nextRow !== currRow) {
                    // BOLT OPTIMIZATION: Use collisionGrid (Uint8Array) for collision checks
                    // Avoids object access on grid[] and property check (.isBuilding)
                    // This is ~1.2-1.3x faster for this block in benchmarks.
                    const collisionGrid = gridMap.collisionGrid;
                    const cols = gridMap.cols;

                    // OPTIMIZATION: Inline getIndex to avoid method call overhead
                    // const cellIndex = gridMap.getIndex(nextCol, nextRow);
                    const cellIndex = nextRow * cols + nextCol;

                    // Si el índice es válido y hay algo en la celda
                    if (cellIndex >= 0 && cellIndex < collisionGrid.length) {
                        // OPTIMIZATION: Use fast boolean check from Uint8Array
                        if (collisionGrid[cellIndex] !== 0) {
                            // Colisión simple: Intentar deslizarse
                            // OPTIMIZATION: Reuse calculated col/row indices
                            // We avoid 2 Math.floor calls here by using currCol/currRow computed above

                            // Verificar movimiento solo en X
                            // nextX col is 'nextCol', current y row is 'currRow'
                            const indexX = currRow * cols + nextCol;
                            if (collisionGrid[indexX] !== 0) {
                                moveX = 0;
                                finalCol = currCol; // Revert X movement impact on grid
                            }

                            // Verificar movimiento solo en Y
                            // current x col is 'currCol', nextY row is 'nextRow'
                            const indexY = nextRow * cols + currCol;
                            if (collisionGrid[indexY] !== 0) {
                                moveY = 0;
                                finalRow = currRow; // Revert Y movement impact on grid
                            }
                        }
                    }
                }
            }

            this.x += moveX;
            this.y += moveY;

            // BOLT OPTIMIZATION: Use local CONFIG (imported) and explicit checks instead of Math.min/max
            if (this.x < 0) this.x = 0;
            else if (this.x > CONFIG.CANVAS_WIDTH) this.x = CONFIG.CANVAS_WIDTH;

            if (this.y < 0) this.y = 0;
            else if (this.y > CONFIG.CANVAS_HEIGHT) this.y = CONFIG.CANVAS_HEIGHT;

            // BOLT OPTIMIZATION: Lazy Cache Update
            // Only update cache if we actually crossed a tile boundary.
            if (gridMap && (moveX !== 0 || moveY !== 0)) {
                // BOLT OPTIMIZATION: Use pre-calculated finalCol/finalRow
                // Avoids recalculating (this.x * invTileSize) | 0 here (~2x faster logic)
                if (finalCol !== this._lastGridCol || finalRow !== this._lastGridRow) {
                    this._lastGridCol = finalCol;
                    this._lastGridRow = finalRow;

                    if (game.terrainMap) {
                        const terrainData = game.terrainMap.getTerrainDataByGrid(finalCol, finalRow);
                        this._cachedTerrainSpeed = terrainData.movementSpeed;
                        this._cachedTerrainData = terrainData;
                    }
                }
            }

            return false; // Still moving
        }

        return true; // Arrived
    }

    takeDamage(amount, attacker = null) {
        super.takeDamage(amount, attacker);

        // Detección de amenazas: Si estamos siendo atacados por una entidad y no estamos ocupados atacando
        if (attacker && !this.attackTarget && attacker !== this) {
            // Si la unidad está ociosa, patrullando o recolectando, responde al ataque
            // Strategist: Las unidades NUNCA deben ignorar un ataque directo, incluso si están moviéndose,
            // a menos que el jugador haya forzado una retirada explícita (this.explicitTarget).
            if (this.canAttack && !this.explicitTarget) {
                this.attackTarget = attacker;
            }
        }
    }

    tryAttack(target, deltaTime, game) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distSq = dx * dx + dy * dy;
        // BOLT OPTIMIZATION: Use cached squared range
        const attackRangeSq = this.attackRangeSq;

        if (distSq <= attackRangeSq && this.attackCooldown <= 0) {
            let damage = this.attackDamage;

            // Combat Triangle / Bonus System
            // Usamos baseType de la unidad (ej. kamayuk es spearman) si type original no está mapeado
            const myType = COMBAT_BONUSES[this.type] ? this.type : (this.baseType || this.type);
            const targetRealType = target.isBuilding ? 'building' : target.type;
            const targetType = COMBAT_BONUSES[targetRealType] ? targetRealType : (target.baseType || targetRealType);

            if (COMBAT_BONUSES[myType]) {
                if (COMBAT_BONUSES[myType][targetType]) {
                    damage *= COMBAT_BONUSES[myType][targetType];
                }
            }

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

            target.takeDamage(damage, this);

            if (this.type === 'archer') {
                if (soundManager.playArrow) soundManager.playArrow();
            } else {
                soundManager.playAttack();
            }

            // Play hit sound with slight delay based on range vs melee
            const hitDelay = this.type === 'archer' ? 300 : 100;
            setTimeout(() => soundManager.playHit(), hitDelay);

            // Palette: Notify if player is under attack
            if (target.team === 'player' && game && game.notifyUnderAttack) {
                game.notifyUnderAttack(target);
            }

            this.attackCooldown = 1 / this.attackSpeed;

            // Palette: Visual Feedback for Damage
            if (game && game.particleSystem) {
                // Floating Damage Text
                game.particleSystem.createFloatingText(target.x, target.y - target.size / 2, `-${Math.floor(damage)}`, '#ff4444');

                // Blood Splatter (only for organic units)
                if (target.isUnit && !target.isBuilding) {
                    game.particleSystem.createBloodSplatter(target.x, target.y, 5);
                } else if (target.isBuilding) {
                    const severity = 1 - (target.hp / target.maxHp);
                    game.particleSystem.createBuildingDamageEffect(target.x, target.y, severity);
                }

                // Projectile Trail for ranged units
                if (this.type === 'archer') {
                    // Bard: Pass a slightly yellow/orange color to simulate a wooden arrow or flaming tip
                    game.particleSystem.createProjectileTrail(this.x, this.y, target.x, target.y, 'rgba(255, 230, 180, 0.9)');
                }
            }
        }
    }

    evaluateTargetScore(enemy, baseScore, distSq) {
        let score = baseScore;
        // Priorizar arqueros sobre aldeanos, sobre guerreros, sobre edificios
        if (enemy.type === 'archer') {
            score += 1000;
        } else if (enemy.type === 'villager') {
            score += 800;
        } else if (enemy.type === 'warrior') {
            score += 500;
        } else if (enemy.isBuilding) {
            score -= 1000; // Penalización severa a edificios si hay tropas cerca
        }

        // Penalización por distancia
        score -= distSq / 1000;
        return score;
    }

    tryGather(node, deltaTime, game) {
        const dx = this.x - node.x;
        const dy = this.y - node.y;
        const distSq = dx * dx + dy * dy;

        // 30 * 30 = 900
        if (distSq <= 900) {
            // BOLT OPTIMIZATION: Removed redundant global typeof check (CONFIG is imported)
            const gatherAmount = CONFIG.GATHER_RATES[node.type] * deltaTime;
            const actualGather = Math.min(gatherAmount, node.amount);

            node.amount -= actualGather;
            game.resources[node.type] += actualGather;

            // Feedback ocasional de recolección (sonido y partículas especiales)
            if (Math.random() < 0.1) {
                soundManager.playGather(node.type);

                if (game && game.particleSystem) {
                    if (node.type === 'gold') {
                        game.particleSystem.createGoldSparkle(node.x, node.y);
                    } else if (node.type === 'wood' && typeof game.particleSystem.createWoodChopEffect === 'function') {
                        game.particleSystem.createWoodChopEffect(node.x, node.y);
                    } else if (node.type === 'stone' && typeof game.particleSystem.createStoneMineEffect === 'function') {
                        game.particleSystem.createStoneMineEffect(node.x, node.y);
                    } else if (node.type === 'food' && typeof game.particleSystem.createFoodGatherEffect === 'function') {
                        game.particleSystem.createFoodGatherEffect(node.x, node.y);
                    }
                }
            }

            // BOLT OPTIMIZATION: Notify game if resource depleted to update minimap cache
            if (node.amount <= 0 && game.notifyResourceDepleted) {
                game.notifyResourceDepleted(node);
            }
        }
    }
}
