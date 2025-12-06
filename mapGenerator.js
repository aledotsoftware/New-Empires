// ==========================================
// GENERADOR DE MAPAS PROCEDURAL
// Sistema determinístico con semilla (seed)
// ==========================================

/**
 * Generador de números pseudoaleatorios basado en semilla (Mulberry32)
 * Garantiza reproducibilidad con la misma semilla
 */
class SeededRandom {
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
class PerlinNoise {
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
class ProceduralMapGenerator {
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

        console.log('✅ Mapa generado exitosamente');

        return this.exportMap();
    }

    /**
     * ETAPA 1: Biome Layout
     * Define la distribución de biomas según el tipo principal
     */
    generateBiomeLayout() {
        // Inicializar matriz de terrenos
        for (let y = 0; y < this.height; y++) {
            this.terrainTypes[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.terrainTypes[y][x] = this.biome;
            }
        }

        // Aplicar variaciones según el bioma principal
        switch (this.biome) {
            case 'grassland':
                this.addBiomePatches('forest', 0.15, 8);
                this.addBiomePatches('desert', 0.05, 6);
                break;
            case 'forest':
                this.addBiomePatches('grassland', 0.20, 10);
                this.addBiomePatches('water', 0.08, 5);
                break;
            case 'desert':
                this.addBiomePatches('grassland', 0.10, 7);
                this.addBiomePatches('mountain', 0.08, 4);
                break;
            case 'tundra':
                this.addBiomePatches('mountain', 0.12, 6);
                this.addBiomePatches('water', 0.10, 8);
                break;
            case 'coastal':
                this.addCoastalBiome();
                break;
        }
    }

    addBiomePatches(biomeType, coverage, patchSize) {
        const targetTiles = Math.floor(this.width * this.height * coverage);
        let tilesPlaced = 0;

        while (tilesPlaced < targetTiles) {
            const centerX = this.rng.int(0, this.width - 1);
            const centerY = this.rng.int(0, this.height - 1);
            const radius = this.rng.int(patchSize / 2, patchSize);

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;

                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius && this.rng.next() > 0.3) {
                            this.terrainTypes[y][x] = biomeType;
                            tilesPlaced++;
                        }
                    }
                }
            }
        }
    }

    addCoastalBiome() {
        // Crear costa en un borde
        const side = this.rng.int(0, 3); // 0=top, 1=right, 2=bottom, 3=left
        const waterDepth = this.rng.int(15, 30);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let isWater = false;

                switch (side) {
                    case 0: isWater = y < waterDepth; break;
                    case 1: isWater = x > this.width - waterDepth; break;
                    case 2: isWater = y > this.height - waterDepth; break;
                    case 3: isWater = x < waterDepth; break;
                }

                if (isWater) {
                    this.terrainTypes[y][x] = 'water';
                }
            }
        }
    }

    /**
     * ETAPA 2: Terrain Generation
     * Genera alturas usando Perlin noise
     */
    generateTerrain() {
        this.heightmap = [];

        for (let y = 0; y < this.height; y++) {
            this.heightmap[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Usar Perlin noise para generar alturas naturales
                const nx = x / this.width;
                const ny = y / this.height;

                let elevation = this.perlin.octaveNoise(nx * 4, ny * 4, 4, 0.5);
                elevation = (elevation + 1) / 2; // Normalizar a [0, 1]

                this.heightmap[y][x] = elevation;

                // Aplicar reglas según estilo
                this.applyStyleRules(x, y, elevation);
            }
        }
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
                }
                break;

            case 'lake':
                // Lago central
                const lakeCenterX = this.width / 2;
                const lakeCenterY = this.height / 2;
                const lakeDist = Math.sqrt((x - lakeCenterX) ** 2 + (y - lakeCenterY) ** 2);
                const lakeRadius = Math.min(this.width, this.height) / 6;

                if (lakeDist < lakeRadius) {
                    this.terrainTypes[y][x] = 'water';
                    this.heightmap[y][x] = 0.1;
                }
                break;

            case 'arena':
                // Mapa cerrado con montañas en los bordes
                const borderDist = Math.min(x, y, this.width - x - 1, this.height - y - 1);
                if (borderDist < 5) {
                    this.terrainTypes[y][x] = 'mountain';
                    this.heightmap[y][x] = 0.9;
                }
                break;
        }

        // Aplicar elevación a tipos de terreno
        if (elevation > 0.7 && this.terrainTypes[y][x] !== 'water') {
            this.terrainTypes[y][x] = 'mountain';
        } else if (elevation > 0.55 && this.terrainTypes[y][x] === 'grassland') {
            this.terrainTypes[y][x] = 'hill';
        } else if (elevation < 0.25 && this.style === 'continental') {
            this.terrainTypes[y][x] = 'water';
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

        // Recursos neutrales distribuidos por el mapa (cantidad muy aumentada)
        this.placeNeutralResources('wood', 250);   // 150 → 250
        this.placeNeutralResources('food', 200);   // 120 → 200
        this.placeNeutralResources('gold', 120);   // 80 → 120
        this.placeNeutralResources('stone', 120);  // 80 → 120

        console.log(`🌍 Recursos generados: ${this.resources.length} nodos totales`);
    }

    placeStartingResources(start) {
        const resourceConfig = [
            { type: 'wood', count: 12, minDist: 6, maxDist: 22, amount: 800 },   // Más nodos, más cantidad
            { type: 'food', count: 12, minDist: 5, maxDist: 18, amount: 600 },   // Más nodos, más cantidad
            { type: 'gold', count: 6, minDist: 8, maxDist: 28, amount: 1500 },   // Más nodos, más cantidad
            { type: 'stone', count: 6, minDist: 8, maxDist: 28, amount: 1200 }   // Más nodos, más cantidad
        ];

        for (let config of resourceConfig) {
            for (let i = 0; i < config.count; i++) {
                const angle = this.rng.next() * Math.PI * 2;
                const dist = this.rng.range(config.minDist, config.maxDist);
                const x = Math.floor(start.x + Math.cos(angle) * dist);
                const y = Math.floor(start.y + Math.sin(angle) * dist);

                if (this.isValidResourcePosition(x, y)) {
                    this.resources.push({
                        x, y,
                        type: config.type,
                        amount: config.amount,
                        playerId: start.playerId
                    });
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
                    const amount = type === 'gold' ? 2000 :    // Oro aumentado
                        type === 'stone' ? 1500 :              // Piedra aumentada
                            type === 'wood' ? 1000 : 900;      // Madera y comida aumentadas
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
