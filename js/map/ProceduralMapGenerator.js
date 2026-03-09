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

        console.log('✅ Mapa generado exitosamente');

        return this.exportMap();
    }

    ensureConnectivity() {
        if (this.playerStarts.length < 2) return;

        // Connect each player to the next one in the list, forming a loop
        for (let i = 0; i < this.playerStarts.length; i++) {
            let start = this.playerStarts[i];
            let end = this.playerStarts[(i + 1) % this.playerStarts.length];

            if (!this.areConnected(start, end)) {
                this.carvePath(start.x, start.y, end.x, end.y);
            }
        }
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

        // Generar un segundo mapa de ruido para temperatura/humedad
        const tempNoise = new PerlinNoise(this.seed + 12345);

        for (let y = 0; y < this.height; y++) {
            this.terrainTypes[y] = [];
            this.heightmap[y] = [];
            for (let x = 0; x < this.width; x++) {
                const nx = x / this.width;
                const ny = y / this.height;

                // Generar elevación (0.0 a 1.0)
                let elevation = this.perlin.octaveNoise(nx * 4, ny * 4, 4, 0.5);
                elevation = (elevation + 1) / 2;

                // Generar temperatura/variación para biomas
                let variation = tempNoise.octaveNoise(nx * 5, ny * 5, 3, 0.5);
                variation = (variation + 1) / 2;

                this.heightmap[y][x] = elevation;

                // Determinar terreno base basado en el bioma principal y el ruido
                let baseTerrain = this.getTerrainFromNoise(elevation, variation, this.biome);
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

    getTerrainFromNoise(elevation, variation, mainBiome) {
        // Lógica de transición suave basada en ruido Perlin (elevación y variación)

        // 1. Manejo de agua (siempre en elevaciones bajas)
        if (elevation < 0.25 + (variation * 0.05) && this.style !== 'arena') {
            return 'water';
        }

        // 2. Manejo de montañas (siempre en elevaciones altas)
        if (elevation > 0.75 - (variation * 0.05)) {
            return 'mountain';
        }

        // 3. Manejo de colinas (transición hacia montañas)
        if (elevation > 0.6 - (variation * 0.05)) {
            return 'hill';
        }

        // 4. Biomas específicos de la llanura (0.25 - 0.6)
        switch (mainBiome) {
            case 'grassland':
                if (variation > 0.7) return 'forest';
                if (variation < 0.2) return 'desert';
                return 'grassland';

            case 'forest':
                if (variation < 0.3) return 'grassland';
                if (variation > 0.8 && elevation < 0.4) return 'water';
                return 'forest';

            case 'desert':
                if (variation > 0.8) return 'grassland';
                return 'desert';

            case 'volcanic':
                if (variation > 0.6) return 'volcanic';
                if (variation < 0.2) return 'desert';
                return 'mountain'; // Más montañas por defecto

            case 'swamp':
                if (variation > 0.5) return 'swamp';
                if (variation < 0.2) return 'water';
                return 'forest';

            case 'archipelago':
                if (elevation < 0.6) return 'water';
                if (variation > 0.7) return 'forest';
                return 'grassland';

            case 'tundra':
                if (variation > 0.7) return 'mountain';
                return 'grassland'; // O nieve si se añade

            case 'coastal':
            default:
                if (variation > 0.7) return 'forest';
                return 'grassland';
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

    placeStartingResources(start) {
        const resourceConfig = [
            { type: 'wood', count: 12, minDist: 6, maxDist: 16, amount: 800 },   // Garantizado más madera cerca
            { type: 'food', count: 8, minDist: 6, maxDist: 15, amount: 500 },
            { type: 'gold', count: 6, minDist: 8, maxDist: 20, amount: 1200 }, // Garantizado más oro cerca
            { type: 'stone', count: 4, minDist: 10, maxDist: 25, amount: 800 }
        ];

        for (let config of resourceConfig) {
            let placed = 0;
            let attempts = 0;
            const maxAttempts = config.count * 20; // 20 intentos por recurso

            while (placed < config.count && attempts < maxAttempts) {
                attempts++;
                const angle = this.rng.next() * Math.PI * 2;

                // Si estamos fallando mucho, permitimos colocar más lejos de forma gradual
                const extraDist = attempts > (maxAttempts / 2) ? (attempts / maxAttempts) * 10 : 0;
                const dist = this.rng.range(config.minDist, config.maxDist + extraDist);

                const x = Math.floor(start.x + Math.cos(angle) * dist);
                const y = Math.floor(start.y + Math.sin(angle) * dist);

                if (this.isValidResourcePosition(x, y)) {
                    this.resources.push({
                        x, y,
                        type: config.type,
                        amount: config.amount,
                        playerId: start.playerId
                    });
                    placed++;
                }
            }
        }
    }

    placeNeutralResources(type, count) {
        let placed = 0;  // Cambiado de const a let para poder incrementar
        const maxAttempts = count * 10;
        let attempts = 0;

        while (placed < count && attempts < maxAttempts) {
            attempts++;
            const x = this.rng.int(10, this.width - 10);
            const y = this.rng.int(10, this.height - 10);

            if (this.isValidResourcePosition(x, y)) {
                // Evitar colocar muy cerca de posiciones iniciales
                let tooClose = false;
                for (let start of this.playerStarts) {
                    const dist = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
                    if (dist < 25) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    // Cantidades mejoradas para recursos neutrales
                    const amount = type === 'gold' ? 1500 :    // Oro: 1200 → 1500
                        type === 'stone' ? 1200 :   // Piedra: 1000 → 1200
                            type === 'wood' ? 800 : 700; // Madera: 800, Comida: 700
                    this.resources.push({
                        x, y,
                        type,
                        amount,
                        playerId: null
                    });
                    placed++;  // IMPORTANTE: Incrementar contador
                }
            }
        }
    }

    isValidResourcePosition(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;

        const terrain = this.terrainTypes[y][x];
        if (terrain === 'water' || terrain === 'mountain') return false;

        // Verificar que no haya otro recurso muy cerca
        for (let res of this.resources) {
            const dist = Math.sqrt((x - res.x) ** 2 + (y - res.y) ** 2);
            if (dist < 3) return false;
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

// Exportar para uso en el juego
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProceduralMapGenerator, SeededRandom, PerlinNoise };
}
