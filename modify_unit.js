const fs = require('fs');
let content = fs.readFileSync('js/entities/Unit.js', 'utf8');

// Update target stickiness in scanForEnemies
content = content.replace(
    /\/\/ Target Stickiness: Evitar cambiar de objetivo constantemente si ya estamos peleando\s+if \(this\.attackTarget === enemy\) \{\s+score \+= 2000;\s+\}/,
    `// Target Stickiness: Evitar cambiar de objetivo constantemente si ya estamos peleando
            if (this.attackTarget === enemy) {
                // Dynamically reduce stickiness if the enemy is successfully fleeing (e.g. kiting archers)
                const isFleeing = distSq > 150 * 150;
                score += isFleeing ? 500 : 2000;
            }`
);

// Add soft separation to moveTowardsTarget
const targetStr = `            const effectiveSpeed = this.speed * speedModifier;

            // OPTIMIZATION: Replace division with multiplication (faster)
            // invDist avoids 2 divisions per frame
            const invDist = 1 / dist;
            const moveStep = effectiveSpeed * deltaTime * invDist;
            let moveX = dx * moveStep;
            let moveY = dy * moveStep;`;

const newStr = `            const effectiveSpeed = this.speed * speedModifier;

            // OPTIMIZATION: Replace division with multiplication (faster)
            // invDist avoids 2 divisions per frame
            const invDist = 1 / dist;
            const moveStep = effectiveSpeed * deltaTime * invDist;
            let moveX = dx * moveStep;
            let moveY = dy * moveStep;

            // --- SOFT SEPARATION (Anti-Clumping) ---
            // Solo aplicamos separación si el juego y las grillas están disponibles, y si la unidad no es un aldeano construyendo
            if (game && (this.team === 'player' ? game.playerUnitGrid : game.enemyUnitGrid)) {
                // No aplicar separación a recolectores para evitar que reboten de los recursos,
                // Opcionalmente solo aplicar a militares.
                if (this.type !== 'villager' || this.state === 'MOVING' || this.state === 'IDLE' || this.state === 'ATTACKING') {
                    const allyGrid = this.team === 'player' ? game.playerUnitGrid : game.enemyUnitGrid;

                    if (!Unit._allyQueryCache) {
                        Unit._allyQueryCache = [];
                    }
                    const allies = Unit._allyQueryCache;

                    // Radio de separación pequeño (24px)
                    allyGrid.query(this.x, this.y, 24, allies, true);

                    let sepX = 0;
                    let sepY = 0;
                    let sepCount = 0;

                    for (let i = 0; i < allies.length; i++) {
                        const ally = allies[i];
                        if (ally === this || ally.isDead) continue;

                        const adx = this.x - ally.x;
                        const ady = this.y - ally.y;
                        const aDistSq = adx * adx + ady * ady;

                        // Separar fuertemente si están casi superpuestos (< 24^2 = 576)
                        if (aDistSq < 576 && aDistSq > 0.1) {
                            const aDist = Math.sqrt(aDistSq);
                            sepX += (adx / aDist);
                            sepY += (ady / aDist);
                            sepCount++;
                        }
                    }

                    if (sepCount > 0) {
                        // Fuerza de separación suave
                        const sepForce = (effectiveSpeed * deltaTime) * 0.5;
                        moveX += (sepX / sepCount) * sepForce;
                        moveY += (sepY / sepCount) * sepForce;
                    }
                }
            }`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('js/entities/Unit.js', content);
