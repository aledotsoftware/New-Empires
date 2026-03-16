import { TERRAIN_TYPES } from '../core/constants.js';

/**
 * TerrainMap - Sistema de gestión de terrenos
 * Genera y gestiona los diferentes tipos de terreno del mapa
 */
export class TerrainMap {
    constructor(width, height, tileSize, seed = Date.now()) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.seed = seed;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);

        // Optimización: Usar Uint8Array en lugar de Array de strings para reducir uso de memoria y GC
        // ID mapping: 0:grassland, 1:forest, 2:water, 3:mountain, 4:hill, 5:desert, 6:volcanic, 7:swamp, 8:archipelago, 9:snow, 10:tundra
        this.grid = new Uint8Array(this.cols * this.rows).fill(0);

        // Cache para mapeo inverso rápido (ID -> String)
        this._idToName = ['grassland', 'forest', 'water', 'mountain', 'hill', 'desert', 'volcanic', 'swamp', 'archipelago', 'snow', 'tundra'];

        // Cache para acceso rápido a datos (ID -> Data Object)
        this._dataCache = [
            TERRAIN_TYPES['grassland'],
            TERRAIN_TYPES['forest'],
            TERRAIN_TYPES['water'],
            TERRAIN_TYPES['mountain'],
            TERRAIN_TYPES['hill'],
            TERRAIN_TYPES['desert'],
            TERRAIN_TYPES['volcanic'],
            TERRAIN_TYPES['swamp'],
            TERRAIN_TYPES['archipelago'],
            TERRAIN_TYPES['snow'],
            TERRAIN_TYPES['tundra']
        ];

        // Mapeo String -> ID para generación
        this._nameToId = {
            'grassland': 0,
            'forest': 1,
            'water': 2,
            'mountain': 3,
            'hill': 4,
            'desert': 5,
            'volcanic': 6,
            'swamp': 7,
            'archipelago': 8,
            'snow': 9,
            'tundra': 10
        };

        // Optimización: Cache inverso para usar multiplicación en lugar de división
        this.invTileSize = 1 / tileSize;

        this.generateTerrain();
    }

    generateTerrain() {
        // Generar bosques (15-20% del mapa)
        this.generatePatches('forest', 0.17, 8);

        // Generar agua (5-10% del mapa)
        this.generatePatches('water', 0.08, 12);

        // Generar montañas (3-5% del mapa)
        this.generatePatches('mountain', 0.04, 6);

        // Generar colinas (8-12% del mapa)
        this.generatePatches('hill', 0.10, 5);

        // Generar desiertos (5-8% del mapa)
        this.generatePatches('desert', 0.06, 7);
    }

    generatePatches(terrainType, coverage, patchSize) {
        const targetId = this._nameToId[terrainType];
        const targetTiles = Math.floor(this.grid.length * coverage);
        let tilesPlaced = 0;
        const maxAttempts = targetTiles * 3;
        let attempts = 0;

        // Use a deterministic pseudo-random approach based on the global map seed
        // offset by the terrain type to avoid generating the exact same pattern for different terrains
        let localSeed = this.seed + this._nameToId[terrainType] * 1000;

        const nextRandom = () => {
            let t = localSeed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

        while (tilesPlaced < targetTiles && attempts < maxAttempts) {
            attempts++;
            const startCol = Math.floor(nextRandom() * this.cols);
            const startRow = Math.floor(nextRandom() * this.rows);

            // Crear parche usando distribución aleatoria determinística
            const patchTiles = Math.floor(patchSize + nextRandom() * patchSize);
            for (let i = 0; i < patchTiles; i++) {
                const offsetX = Math.floor(nextRandom() * patchSize) - patchSize / 2;
                const offsetY = Math.floor(nextRandom() * patchSize) - patchSize / 2;
                const col = startCol + offsetX;
                const row = startRow + offsetY;

                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const index = this.getIndex(col, row);
                    // 0 es grassland
                    if (this.grid[index] === 0) {
                        this.grid[index] = targetId;
                        tilesPlaced++;
                        if (tilesPlaced >= targetTiles) break;
                    }
                }
            }
        }
    }

    getIndex(col, row) {
        return row * this.cols + col;
    }

    getTerrainAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 'grassland';
        }

        const index = this.getIndex(col, row);
        const id = this.grid[index];
        return this._idToName[id] || 'grassland';
    }

    /**
     * Versión optimizada de obtener datos de terreno.
     * Evita conversiones de string y búsquedas en objeto.
     * @param {number} x - Coordenada X en pixeles
     * @param {number} y - Coordenada Y en pixeles
     * @returns {Object} Datos del terreno (velocidad, bonos, etc.)
     */
    getTerrainDataAt(x, y) {
        // Optimización: Bitwise OR es más rápido que Math.floor
        const col = (x * this.invTileSize) | 0;
        const row = (y * this.invTileSize) | 0;

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return this._dataCache[0]; // Default grassland
        }

        // Optimización: Inline getIndex
        const index = row * this.cols + col;
        const id = this.grid[index];
        return this._dataCache[id] || this._dataCache[0];
    }

    /**
     * Obtiene datos del terreno usando coordenadas de grid ya calculadas.
     * Evita recalcular col/row si ya se conocen.
     * @param {number} col - Columna del grid
     * @param {number} row - Fila del grid
     * @returns {Object} Datos del terreno
     */
    getTerrainDataByGrid(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return this._dataCache[0];
        }

        const index = row * this.cols + col;
        const id = this.grid[index];
        return this._dataCache[id] || this._dataCache[0];
    }

    getTerrainData(terrainType) {
        return TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.grassland;
    }

    canBuildAt(x, y, widthTiles, heightTiles) {
        // BOLT OPTIMIZATION: Convert world coords to grid once
        const invTileSize = this.invTileSize || (1 / this.tileSize);
        const startCol = (x * invTileSize) | 0;
        const startRow = (y * invTileSize) | 0;

        // Iterate over tiles directly
        for (let i = 0; i < widthTiles; i++) {
            for (let j = 0; j < heightTiles; j++) {
                const terrainData = this.getTerrainDataByGrid(startCol + i, startRow + j);
                if (!terrainData.buildable) {
                    return false;
                }
            }
        }
        return true;
    }
}
