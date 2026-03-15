// ==========================================
// GENERADOR DE MAPAS PROCEDURAL
// Sistema determinístico con semilla (seed)
// ==========================================

/**
 * Generador de números pseudoaleatorios basado en semilla (Mulberry32)
 * Garantiza reproducibilidad con la misma semilla
 */
export class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    next() {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    choice(array) {
        return array[this.int(0, array.length - 1)];
    }
}

/**
 * Generador de ruido Perlin simplificado para terrenos naturales
 */
export class PerlinNoise {
    constructor(seed) {
        this.rng = new SeededRandom(seed);
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        // Shuffle usando la semilla
        for (let i = 255; i > 0; i--) {
            const j = this.rng.int(0, i);
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        this.permutation = this.permutation.concat(this.permutation);
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.permutation[X] + Y;
        const aa = this.permutation[a];
        const ab = this.permutation[a + 1];
        const b = this.permutation[X + 1] + Y;
        const ba = this.permutation[b];
        const bb = this.permutation[b + 1];

        return this.lerp(v,
            this.lerp(u, this.grad(this.permutation[aa], x, y),
                this.grad(this.permutation[ba], x - 1, y)),
            this.lerp(u, this.grad(this.permutation[ab], x, y - 1),
                this.grad(this.permutation[bb], x - 1, y - 1))
        );
    }

    octaveNoise(x, y, octaves, persistence) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }
}

/**
 * Generador de Mapas Procedural tipo Age of Empires
 */
export class ProceduralMapGenerator {
    constructor(config) {
        this.seed = config.seed || Date.now();
        this.width = config.width || 200;
        this.height = config.height || 200;
        this.numPlayers = config.numPlayers || 2;
        this.biome = config.biome || 'grassland'; // grassland, forest, desert, tundra, coastal
        this.style = config.style || 'continental'; // continental, islands, arena, lake, symmetric, asymmetric

        this.rng = new SeededRandom(this.seed);
        this.perlin = new PerlinNoise(this.seed);

        // Matriz del mapa
        this.heightmap = [];
        this.terrainTypes = [];
        this.resources = [];
        this.playerStarts = [];
        this.decorations = [];
    }

    /**
     * Genera el mapa completo en etapas
     */
    generate() {
        console.log(`🗺️ Generando mapa con semilla: ${this.seed}`);

        // Etapa 1: Biome Layout
        this.generateBiomeLayout();

        // Etapa 2: Terrain Generation (alturas, agua, ríos, colinas)
        this.generateTerrain();

        // Etapa 3: Player Placement (posiciones equidistantes)
        this.generatePlayerStarts();

        // Etapa 4: Resource Placement (balanceado)
        this.generateResources();

        // Etapa 5: Neutral Elements (aldeas, animales, reliquias)
        this.generateNeutralElements();

        // Etapa 6: Connectivity Check
        this.ensureConnectivity();

        // Etapa 7: Resource Accessibility
        this.ensureResourceAccessibility();

        console.log('✅ Mapa generado exitosamente');

        return this.exportMap();
    }

    ensureResourceAccessibility() {
        if (this.playerStarts.length === 0 || this.resources.length === 0) return;

        // Flood fill global desde el primer jugador para encontrar toda el área conectada
        const start = this.playerStarts[0];
        const visited = new Uint8Array(this.width * this.height);
        const queue = new Int32Array(this.width * this.height * 2);

        let head = 0;
        let tail = 0;

        // Push inicial
        queue[tail++] = start.x;
        queue[tail++] = start.y;
        visited[start.y * this.width + start.x] = 1;

        while (head < tail) {
            const cx = queue[head++];
            const cy = queue[head++];

            // Check neighbors (4-way)
            const neighbors = [
                {x: cx+1, y: cy}, {x: cx-1, y: cy},
                {x: cx, y: cy+1}, {x: cx, y: cy-1}
            ];

            for (let n of neighbors) {
                if (n.x >= 0 && n.x < this.width && n.y >= 0 && n.y < this.height) {
                    const idx = n.y * this.width + n.x;
                    if (visited[idx] === 0) {
                        const terrain = this.terrainTypes[n.y][n.x];
                        if (terrain !== 'water' && terrain !== 'mountain') {
                            visited[idx] = 1;
                            queue[tail++] = n.x;
                            queue[tail++] = n.y;
                        }
                    }
                }
            }
        }

        // Ahora comprobamos cada recurso en O(1) mirando el array visited
        for (let i = 0; i < this.resources.length; i++) {
            const res = this.resources[i];
            const idx = res.y * this.width + res.x;

            if (visited[idx] === 0) {
                // El recurso es inaccesible, hacemos un túnel hasta el inicio
                // En una implementación más avanzada se conectaría al nodo visitado más cercano,
                // pero carvePath hacia el inicio maestro es robusto y simple.
                this.carvePath(start.x, start.y, res.x, res.y);
            }
        }
    }

    ensureConnectivity() {
        const landmasses = this.floodFillLandmasses();

        // Si no hay o hay solo 1 masa de tierra, ya está conectado
        if (landmasses.length <= 1) return;

        console.log(`🌍 Detectadas ${landmasses.length} masas de tierra separadas. Iniciando conexiones globales.`);

        // Identificar la masa principal (por tamaño o conteniendo al jugador 1)
        let mainMass = landmasses[0];
        if (this.playerStarts.length > 0) {
            const p1 = this.playerStarts[0];
            // Encontrar la masa del p1 midiendo distancias (simplificado)
            for (let m of landmasses) {
                // Chequeo rapido si el punto p1 esta dentro de los tiles
                let found = false;
                for (let i = 0; i < m.tiles.length; i++) {
                    const t = m.tiles[i];
                    if (t.x === p1.x && t.y === p1.y) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    mainMass = m;
                    break;
                }
            }
        }

        // Conectar el centro de cada isla menor al centro de la masa principal
        for (let m of landmasses) {
            if (m.id !== mainMass.id && m.tiles.length > 5) { // Ignorar islitas insignificantes de < 5 tiles
                let closestM = m.tiles[0];
                let closestMain = mainMass.tiles[0];
                let minSubDist = Infinity;

                for (let i = 0; i < m.tiles.length; i+=3) { // skip some tiles for performance
                    const t1 = m.tiles[i];
                    for (let j = 0; j < mainMass.tiles.length; j+=10) { // skip more main tiles
                        const t2 = mainMass.tiles[j];
                        const distSq = (t1.x - t2.x)**2 + (t1.y - t2.y)**2;
                        if (distSq < minSubDist) {
                            minSubDist = distSq;
                            closestM = t1;
                            closestMain = t2;
                        }
                    }
                }

                this.carvePath(closestM.x, closestM.y, closestMain.x, closestMain.y);
            }
        }
    }

    floodFillLandmasses() {
        // Usa Int32Array para soportar ids mayores a 255 y evitar desbordamiento en mapas gigantes
        const visited = new Int32Array(this.width * this.height);
        const landmasses = [];
        let landmassId = 1;

        // Optimización: Usar Int32Array para la cola para evitar O(N) array push/shift overhead
        const queue = new Int32Array(this.width * this.height * 2);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                if (visited[idx] === 0) {
                    const terrain = this.terrainTypes[y][x];
                    if (terrain !== 'water' && terrain !== 'mountain') {
                        // Iniciar nuevo flood fill
                        const currentMass = { id: landmassId++, tiles: [], centerX: 0, centerY: 0 };

                        let head = 0;
                        let tail = 0;
                        queue[tail++] = x;
                        queue[tail++] = y;

                        visited[idx] = landmassId;

                        let sumX = 0;
                        let sumY = 0;

                        while (head < tail) {
                            const cx = queue[head++];
                            const cy = queue[head++];

                            currentMass.tiles.push({x: cx, y: cy});
                            sumX += cx;
                            sumY += cy;

                            // 4-way neighbors
                            const neighbors = [
                                {x: cx+1, y: cy}, {x: cx-1, y: cy},
                                {x: cx, y: cy+1}, {x: cx, y: cy-1}
                            ];

                            for (let n of neighbors) {
                                if (n.x >= 0 && n.x < this.width && n.y >= 0 && n.y < this.height) {
                                    const nIdx = n.y * this.width + n.x;
                                    if (visited[nIdx] === 0) {
                                        const nTerrain = this.terrainTypes[n.y][n.x];
                                        if (nTerrain !== 'water' && nTerrain !== 'mountain') {
                                            visited[nIdx] = landmassId;
                                            queue[tail++] = n.x;
                                            queue[tail++] = n.y;
                                        }
                                    }
                                }
                            }
                        }

                        // Calcular centro geométrico de la masa de tierra
                        if (currentMass.tiles.length > 0) {
                            currentMass.centerX = Math.floor(sumX / currentMass.tiles.length);
                            currentMass.centerY = Math.floor(sumY / currentMass.tiles.length);

                            // Asegurarse de que el centro sea un tile válido de la masa (por si es cóncava)
                            let closest = currentMass.tiles[0];
                            let minDistSq = Infinity;
                            for (let t of currentMass.tiles) {
                                const distSq = (t.x - currentMass.centerX)**2 + (t.y - currentMass.centerY)**2;
                                if (distSq < minDistSq) {
                                    minDistSq = distSq;
                                    closest = t;
                                }
                            }
                            currentMass.centerX = closest.x;
                            currentMass.centerY = closest.y;

                            landmasses.push(currentMass);
                        }
                    } else {
                        // Marcar obstáculos como visitados para no iterar sobre ellos después
                        visited[idx] = 255;
                    }
                }
            }
        }

        // Ordenar landmasses por tamaño descendente
        return landmasses.sort((a, b) => b.tiles.length - a.tiles.length);
    }

    areConnected(start, end) {
        // Simple Flood Fill (BFS) to check connectivity
        const visited = new Uint8Array(this.width * this.height);
        const queue = [start.x, start.y];

        visited[start.y * this.width + start.x] = 1;

        let head = 0;

        // Optimización: Si la distancia al objetivo es menor, la búsqueda es más rápida
        while (head < queue.length) {
            const cx = queue[head++];
            const cy = queue[head++];

            if (cx === end.x && cy === end.y) {
                return true;
            }

            // Check neighbors
            const neighbors = [
                {x: cx+1, y: cy}, {x: cx-1, y: cy},
                {x: cx, y: cy+1}, {x: cx, y: cy-1}
            ];

            for (let n of neighbors) {
                if (n.x >= 0 && n.x < this.width && n.y >= 0 && n.y < this.height) {
                    const idx = n.y * this.width + n.x;
                    if (visited[idx] === 0) {
                        const terrain = this.terrainTypes[n.y][n.x];
                        // Solo pasable si no es agua ni montaña
                        if (terrain !== 'water' && terrain !== 'mountain') {
                            visited[idx] = 1;
                            queue.push(n.x, n.y);
                        }
                    }
                }
            }
        }

        return false;
    }

    carvePath(x1, y1, x2, y2) {
        // Simple Bresenham line carving to ensure connectivity
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let sx = (x1 < x2) ? 1 : -1;
        let sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;

        let cx = x1;
        let cy = y1;

        while (true) {
            // Añadir un offset "wobble" para que el camino parezca más natural (sinuoso)
            const wobbleX = this.rng.int(-1, 1);
            const wobbleY = this.rng.int(-1, 1);

            // Carve a small radius to make a wider path
            for(let py = -2; py <= 2; py++) {
                for(let px = -2; px <= 2; px++) {
                    let nx = cx + px + wobbleX;
                    let ny = cy + py + wobbleY;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        let t = this.terrainTypes[ny][nx];
                        if (t === 'water' || t === 'mountain') {
                            this.terrainTypes[ny][nx] = 'grassland';
                            this.heightmap[ny][nx] = 0.5; // Neutral elevation
                        }
                    }
                }
            }

            if ((cx === x2) && (cy === y2)) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }
        }
    }

    /**
     * ETAPA 1 & 2: Biome Layout y Terrain Generation
     * Define la distribución de biomas y elevaciones usando ruido de Perlin suave.
     */
    generateBiomeLayout() {
        this.heightmap = [];
        this.terrainTypes = [];

        // Generar mapas de ruido adicionales para temperatura y humedad
        const tempNoise = new PerlinNoise(this.seed + 12345);
        const moistNoise = new PerlinNoise(this.seed + 54321);

        for (let y = 0; y < this.height; y++) {
            this.terrainTypes[y] = [];
            this.heightmap[y] = [];
            for (let x = 0; x < this.width; x++) {
                const nx = x / this.width;
                const ny = y / this.height;

                // Generar elevación (0.0 a 1.0)
                let elevation = this.perlin.octaveNoise(nx * 4, ny * 4, 4, 0.5);
                elevation = (elevation + 1) / 2;

                // Generar temperatura (0.0 a 1.0)
                let temperature = tempNoise.octaveNoise(nx * 3, ny * 3, 3, 0.5);
                temperature = (temperature + 1) / 2;

                // Generar humedad (0.0 a 1.0)
                let moisture = moistNoise.octaveNoise(nx * 3.5, ny * 3.5, 3, 0.5);
                moisture = (moisture + 1) / 2;

                this.heightmap[y][x] = elevation;

                // Determinar terreno base basado en la elevación, temperatura, humedad y el bioma principal
                let baseTerrain = this.getTerrainFromNoise(elevation, temperature, moisture, this.biome);
                this.terrainTypes[y][x] = baseTerrain;

                // Aplicar modificadores de estilo de mapa (arena, islas, etc)
                this.applyStyleRules(x, y, elevation);
            }
        }

        // Aplicar borde costero si es necesario
        if (this.biome === 'coastal') {
            this.addCoastalBiome();
        }
    }

    getTerrainFromNoise(elevation, temperature, moisture, mainBiome) {
        // Lógica de transición suave basada en ruido Perlin usando diagrama de biomas

        // Offset de bioma: Alteramos la temperatura y humedad base según el bioma principal del mapa
        let t = temperature;
        let m = moisture;

        switch (mainBiome) {
            case 'desert': t += 0.3; m -= 0.3; break;
            case 'forest': m += 0.3; break;
            case 'tundra': t -= 0.3; break;
            case 'swamp': m += 0.4; break;
            case 'volcanic': t += 0.4; m -= 0.2; break;
        }

        // Clamp
        t = Math.max(0, Math.min(1, t));
        m = Math.max(0, Math.min(1, m));

        // 1. Manejo de agua (siempre en elevaciones bajas)
        if (elevation < 0.25 + (m * 0.05) && this.style !== 'arena') {
            if (t < 0.2) return 'water'; // Agua helada (o hielo si existiese)
            if (m > 0.8 && t > 0.6 && mainBiome === 'swamp') return 'swamp';
            return 'water';
        }

        // 2. Manejo de montañas (siempre en elevaciones altas)
        if (elevation > 0.75 - (t * 0.05)) {
            if (t < 0.35) return 'snow'; // Montañas nevadas
            if (t > 0.8 && mainBiome === 'volcanic') return 'volcanic';
            return 'mountain';
        }

        // 3. Manejo de colinas (transición hacia montañas)
        if (elevation > 0.6 - (t * 0.05)) {
            if (t < 0.2) return 'snow';
            if (t < 0.4) return 'tundra';
            return 'hill';
        }

        // 4. Biomas específicos de la llanura (0.25 - 0.6)
        // Usamos t (temperatura) y m (humedad) para definir la región

        if (t < 0.25) {
            // Muy frío
            if (m > 0.5) return 'snow';
            return 'tundra';
        } else if (t < 0.4) {
            // Frío de transición
            if (m > 0.6) return 'forest';
            // Prevenir desierto tan cerca de zonas nevadas si la humedad es muy baja
            if (m < 0.3) return 'grassland';
            return 'tundra';
        } else if (t < 0.6) {
            // Templado (banda intermedia obligatoria)
            if (m > 0.6) return 'forest';
            // Prevenir desierto tan cerca de zonas frías (t < 0.4)
            if (m < 0.15) return 'grassland';
            return 'grassland';
        } else if (t < 0.75) {
            // Templado/Cálido
            if (m > 0.6) return 'forest';
            if (m < 0.15) return 'desert';
            return 'grassland';
        } else {
            // Muy cálido
            if (m > 0.7) {
                if (mainBiome === 'swamp') return 'swamp';
                return 'forest'; // Selva/Jungla
            }
            if (m < 0.3) return 'desert';
            if (mainBiome === 'volcanic' && m < 0.6) return 'volcanic';
            return 'grassland'; // Sabana
        }
    }

    addCoastalBiome() {
        // Crear costa en un borde (0=top, 1=right, 2=bottom, 3=left)
        const side = this.rng.int(0, 3);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let distToEdge = 0;
                switch (side) {
                    case 0: distToEdge = y; break;
                    case 1: distToEdge = this.width - x; break;
                    case 2: distToEdge = this.height - y; break;
                    case 3: distToEdge = x; break;
                }

                // Transición suave hacia el agua usando ruido
                const noise = this.heightmap[y][x];
                const shoreLimit = 20 + noise * 15;

                if (distToEdge < shoreLimit) {
                    this.terrainTypes[y][x] = 'water';
                    this.heightmap[y][x] = 0.1;
                } else if (distToEdge < shoreLimit + 5 && this.terrainTypes[y][x] !== 'water') {
                    // Playa de transición
                    this.terrainTypes[y][x] = 'desert';
                }
            }
        }
    }

    /**
     * ETAPA 2: Terrain Generation
     * Reemplazado por generateBiomeLayout que hace ambas cosas en un solo pase.
     */
    generateTerrain() {
        // Ya no es necesario, se hace en generateBiomeLayout
    }

    applyStyleRules(x, y, elevation) {
        switch (this.style) {
            case 'islands':
                // Crear islas usando distancia al centro
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
                const islandFactor = 1 - (dist / maxDist);

                if (elevation < 0.3 || islandFactor < 0.4) {
                    this.terrainTypes[y][x] = 'water';
                    this.heightmap[y][x] = 0.1;
                }
                break;

            case 'lake':
                // Lago central
                const lakeCenterX = this.width / 2;
                const lakeCenterY = this.height / 2;
                const lakeDist = Math.sqrt((x - lakeCenterX) ** 2 + (y - lakeCenterY) ** 2);
                const lakeRadius = Math.min(this.width, this.height) / 6;

                // Bordes difuminados usando el ruido Perlin existente
                if (lakeDist < lakeRadius + (elevation * 10 - 5)) {
                    this.terrainTypes[y][x] = 'water';
                    this.heightmap[y][x] = 0.1;
                }
                break;

            case 'arena':
                // Mapa cerrado con montañas en los bordes
                const borderDist = Math.min(x, y, this.width - x - 1, this.height - y - 1);

                // Montañas con bordes irregulares
                if (borderDist < 5 + (elevation * 3)) {
                    this.terrainTypes[y][x] = 'mountain';
                    this.heightmap[y][x] = 0.9;
                }
                break;
        }
    }

    /**
     * ETAPA 3: Player Placement
     * Coloca jugadores equidistantes con recursos garantizados
     */
    generatePlayerStarts() {
        this.playerStarts = [];

        if (this.style === 'symmetric') {
            this.generateSymmetricStarts();
        } else {
            this.generateBalancedStarts();
        }
    }

    generateSymmetricStarts() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.35;

        for (let i = 0; i < this.numPlayers; i++) {
            const angle = (Math.PI * 2 / this.numPlayers) * i;
            const x = Math.floor(centerX + Math.cos(angle) * radius);
            const y = Math.floor(centerY + Math.sin(angle) * radius);

            this.ensureBuildableArea(x, y, 15);
            this.playerStarts.push({ x, y, playerId: i + 1 });
        }
    }

    generateBalancedStarts() {
        const attempts = 1000;
        const minDistance = Math.min(this.width, this.height) * 0.3;

        for (let i = 0; i < this.numPlayers; i++) {
            let bestPos = null;
            let bestScore = -Infinity;

            for (let attempt = 0; attempt < attempts; attempt++) {
                const x = this.rng.int(20, this.width - 20);
                const y = this.rng.int(20, this.height - 20);

                // Verificar que sea construible
                if (this.terrainTypes[y][x] === 'water' || this.terrainTypes[y][x] === 'mountain') {
                    continue;
                }

                // Calcular distancia mínima a otros jugadores
                let minDistToOthers = Infinity;
                for (let other of this.playerStarts) {
                    const dist = Math.sqrt((x - other.x) ** 2 + (y - other.y) ** 2);
                    minDistToOthers = Math.min(minDistToOthers, dist);
                }

                // Preferir posiciones más alejadas
                if (minDistToOthers > bestScore && minDistToOthers > minDistance) {
                    bestScore = minDistToOthers;
                    bestPos = { x, y };
                }
            }

            if (bestPos) {
                this.ensureBuildableArea(bestPos.x, bestPos.y, 15);
                this.playerStarts.push({ x: bestPos.x, y: bestPos.y, playerId: i + 1 });
            }
        }
    }

    ensureBuildableArea(centerX, centerY, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;

                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                        this.terrainTypes[y][x] = 'grassland';
                        this.heightmap[y][x] = 0.5;
                    }
                }
            }
        }
    }

    /**
     * ETAPA 4: Resource Placement
     * Distribuye recursos de forma balanceada
     */
    generateResources() {
        this.resources = [];

        // Recursos iniciales cerca de cada jugador
        for (let start of this.playerStarts) {
            this.placeStartingResources(start);
        }

        // Recursos neutrales distribuidos por el mapa (cantidades duplicadas para más recursos)
        this.placeNeutralResources('wood', 80);   // Duplicado: 40 → 80
        this.placeNeutralResources('food', 70);   // Duplicado: 35 → 70
        this.placeNeutralResources('gold', 40);   // Duplicado: 20 → 40
        this.placeNeutralResources('stone', 40);  // Duplicado: 20 → 40

        console.log(`🌍 Recursos generados: ${this.resources.length} nodos totales`);
    }

    placeCluster(centerX, centerY, config, playerId) {
        let placed = 0;
        let forceAttempts = 0;
        const maxForceAttempts = config.count * 10;

        // Intentar colocar recursos agrupados en espiral o aleatorio cercano
        while (placed < config.count && forceAttempts < maxForceAttempts) {
            forceAttempts++;

            // Distancia y ángulo para clúster (muy juntos)
            const angle = this.rng.next() * Math.PI * 2;
            const dist = this.rng.range(0, 3 + (placed / 2)); // Se expanden a medida que crece el clúster

            const fx = Math.floor(centerX + Math.cos(angle) * dist);
            const fy = Math.floor(centerY + Math.sin(angle) * dist);

            // Verificar bordes del mapa
            if (fx >= 0 && fx < this.width && fy >= 0 && fy < this.height) {
                const terrain = this.terrainTypes[fy][fx];
                if (terrain !== 'water' && terrain !== 'mountain') {
                    // Comprobación de que no hay ya un recurso forzado encima
                    let isOccupied = false;
                    for (let res of this.resources) {
                        if (res.x === fx && res.y === fy) {
                            isOccupied = true;
                            break;
                        }
                    }

                    if (!isOccupied) {
                        this.resources.push({
                            x: fx, y: fy,
                            type: config.type,
                            amount: config.amount,
                            playerId: playerId
                        });
                        placed++;
                    }
                }
            }
        }
        return placed;
    }

    placeStartingResources(start) {
        const resourceConfig = [
            { type: 'wood', count: 12, minDist: 8, maxDist: 14, amount: 800 },
            { type: 'food', count: 8, minDist: 7, maxDist: 12, amount: 500 },
            { type: 'gold', count: 6, minDist: 9, maxDist: 15, amount: 1200 },
            { type: 'stone', count: 4, minDist: 10, maxDist: 18, amount: 800 }
        ];

        for (let config of resourceConfig) {
            let placed = 0;
            let attempts = 0;
            const maxAttempts = 50;

            // Intentar encontrar un buen centro para el clúster
            while (placed < config.count && attempts < maxAttempts) {
                attempts++;
                const angle = this.rng.next() * Math.PI * 2;
                const extraDist = attempts > (maxAttempts / 2) ? (attempts / maxAttempts) * 5 : 0;
                const dist = this.rng.range(config.minDist, config.maxDist + extraDist);

                const cx = Math.floor(start.x + Math.cos(angle) * dist);
                const cy = Math.floor(start.y + Math.sin(angle) * dist);

                if (this.isValidResourceCenter(cx, cy)) {
                    // Solo intentar colocar los que faltan
                    const remaining = config.count - placed;
                    const batchConfig = { ...config, count: remaining };
                    placed += this.placeCluster(cx, cy, batchConfig, start.playerId);
                }
            }

            // Fallback: forzar ubicación cerca del inicio si no se encontró centro o no se colocaron todos
            if (placed < config.count) {
                console.warn(`Generación forzada de recursos iniciales en clúster para ${config.type}`);

                let forceDist = config.minDist;
                let angleStep = Math.PI / 4;
                let currentAngle = 0;
                let forceCenterAttempts = 0;

                while (placed < config.count && forceCenterAttempts < 50) {
                    forceCenterAttempts++;
                    const cx = Math.floor(start.x + Math.cos(currentAngle) * forceDist);
                    const cy = Math.floor(start.y + Math.sin(currentAngle) * forceDist);

                    if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height) {
                        // Modificar el centro para asegurar que se puede construir el clúster
                        this.terrainTypes[cy][cx] = 'grassland';
                        this.heightmap[cy][cx] = 0.5;

                        const remaining = config.count - placed;
                        const batchConfig = { ...config, count: remaining };
                        placed += this.placeCluster(cx, cy, batchConfig, start.playerId);
                    }

                    currentAngle += angleStep;
                    if (currentAngle >= Math.PI * 2) {
                        currentAngle = 0;
                        forceDist += 2;
                    }
                }

                // Fallback de emergencia extremo: asegurar madera y oro si fallaron todos los intentos normales
                if (placed < config.count && (config.type === 'wood' || config.type === 'gold')) {
                    console.warn(`Generación de emergencia absoluta para ${config.type}`);
                    let emergencyDist = 7; // Más lejos del centro urbano para no bloquear
                    let currAngle = 0;

                    // Bailout limit to prevent infinite loops if the map is too congested or small
                    const maxDist = Math.max(this.width, this.height);

                    while (placed < config.count && emergencyDist <= maxDist) {
                        const ex = Math.floor(start.x + Math.cos(currAngle) * emergencyDist);
                        const ey = Math.floor(start.y + Math.sin(currAngle) * emergencyDist);

                        if (ex >= 0 && ex < this.width - 1 && ey >= 0 && ey < this.height - 1) {
                            // Convertir terreno estrictamente antes de intentar situarlo (área 2x2 para garantizar acceso)
                            for (let dy = 0; dy <= 1; dy++) {
                                for (let dx = 0; dx <= 1; dx++) {
                                    this.terrainTypes[ey + dy][ex + dx] = 'grassland';
                                    this.heightmap[ey + dy][ex + dx] = 0.5;
                                }
                            }
                            this.carvePath(start.x, start.y, ex, ey);

                            // Asegurarse de que no esté ocupado
                            let isOccupied = false;
                            for (let res of this.resources) {
                                if (res.x === ex && res.y === ey) {
                                    isOccupied = true;
                                    break;
                                }
                            }

                            if (!isOccupied) {
                                this.resources.push({
                                    x: ex, y: ey,
                                    type: config.type,
                                    amount: config.amount,
                                    playerId: start.playerId
                                });
                                placed++;
                            }
                        }

                        currAngle += Math.PI / 8;
                        if (currAngle >= Math.PI * 2) {
                            currAngle = 0;
                            emergencyDist++;
                        }
                    }
                }
            }
        }
    }

    placeNeutralResources(type, count) {
        // En lugar de colocar 1 a 1, colocamos clústers de un tamaño base
        const clusterSize = type === 'wood' ? 6 : type === 'food' ? 4 : type === 'gold' ? 4 : 3;
        const amount = type === 'gold' ? 1500 : type === 'stone' ? 1200 : type === 'wood' ? 800 : 700;

        const numClusters = Math.ceil(count / clusterSize);
        let clustersPlaced = 0;
        const maxAttempts = numClusters * 20;
        let attempts = 0;

        while (clustersPlaced < numClusters && attempts < maxAttempts) {
            attempts++;
            const cx = this.rng.int(10, this.width - 10);
            const cy = this.rng.int(10, this.height - 10);

            if (this.isValidResourceCenter(cx, cy)) {
                let tooClose = false;
                for (let start of this.playerStarts) {
                    const dist = Math.sqrt((cx - start.x) ** 2 + (cy - start.y) ** 2);
                    if (dist < 25) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    const placedInCluster = this.placeCluster(cx, cy, {
                        type: type,
                        count: clusterSize,
                        amount: amount
                    }, null);

                    if (placedInCluster > 0) {
                        clustersPlaced++;
                    }
                }
            }
        }
    }

    isValidResourceCenter(cx, cy) {
        if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) return false;

        const terrain = this.terrainTypes[cy][cx];
        if (terrain === 'water' || terrain === 'mountain') return false;

        // Verificar que el centro no esté muy cerca de otros recursos
        for (let res of this.resources) {
            const dist = Math.sqrt((cx - res.x) ** 2 + (cy - res.y) ** 2);
            if (dist < 5) return false; // Distancia mínima entre clústers
        }

        return true;
    }

    /**
     * ETAPA 5: Neutral Elements
     * Aldeas neutrales, animales, reliquias, caminos
     */
    generateNeutralElements() {
        this.decorations = [];

        // Aldeas neutrales (2-4 por mapa)
        const numVillages = this.rng.int(2, 4);
        for (let i = 0; i < numVillages; i++) {
            const x = this.rng.int(20, this.width - 20);
            const y = this.rng.int(20, this.height - 20);

            if (this.terrainTypes[y][x] === 'grassland') {
                this.decorations.push({
                    type: 'neutral_village',
                    x, y
                });
            }
        }

        // Animales (ovejas, jabalíes)
        const numAnimals = this.rng.int(15, 30);
        for (let i = 0; i < numAnimals; i++) {
            const x = this.rng.int(10, this.width - 10);
            const y = this.rng.int(10, this.height - 10);

            if (this.terrainTypes[y][x] === 'grassland' || this.terrainTypes[y][x] === 'forest') {
                this.decorations.push({
                    type: this.rng.next() > 0.5 ? 'sheep' : 'boar',
                    x, y
                });
            }
        }

        // Reliquias (1-3 por mapa)
        const numRelics = this.rng.int(1, 3);
        for (let i = 0; i < numRelics; i++) {
            const x = this.rng.int(20, this.width - 20);
            const y = this.rng.int(20, this.height - 20);

            this.decorations.push({
                type: 'relic',
                x, y
            });
        }
    }

    /**
     * Exporta el mapa en formato JSON estructurado
     */
    exportMap() {
        return {
            metadata: {
                seed: this.seed,
                width: this.width,
                height: this.height,
                numPlayers: this.numPlayers,
                biome: this.biome,
                style: this.style,
                generatedAt: new Date().toISOString()
            },
            heightmap: this.heightmap,
            terrainTypes: this.terrainTypes,
            resources: this.resources,
            playerStarts: this.playerStarts,
            decorations: this.decorations
        };
    }
}

