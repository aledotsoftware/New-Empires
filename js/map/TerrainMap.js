import { TERRAIN_TYPES } from '../core/constants.js';

const TERRAIN_IDS = {
    'grassland': 0,
    'forest': 1,
    'water': 2,
    'mountain': 3,
    'hill': 4,
    'desert': 5
};

const ID_TO_TERRAIN = [
    'grassland',
    'forest',
    'water',
    'mountain',
    'hill',
    'desert'
];

/**
 * TerrainMap - Sistema de gestión de terrenos
 * Genera y gestiona los diferentes tipos de terreno del mapa
 */
export class TerrainMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);

        // Optimización: Usar Uint8Array en lugar de Array de strings
        this.grid = new Uint8Array(this.cols * this.rows).fill(TERRAIN_IDS['grassland']);

        // Cache para acceso rápido a datos de terreno (evita búsquedas por string)
        this._terrainDataCache = ID_TO_TERRAIN.map(id => TERRAIN_TYPES[id]);

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
        const targetTiles = Math.floor(this.grid.length * coverage);
        let tilesPlaced = 0;
        const maxAttempts = targetTiles * 3;
        let attempts = 0;

        const terrainId = TERRAIN_IDS[terrainType];

        while (tilesPlaced < targetTiles && attempts < maxAttempts) {
            attempts++;
            const startCol = Math.floor(Math.random() * this.cols);
            const startRow = Math.floor(Math.random() * this.rows);

            // Crear parche usando distribución aleatoria
            const patchTiles = Math.floor(patchSize + Math.random() * patchSize);
            for (let i = 0; i < patchTiles; i++) {
                const offsetX = Math.floor(Math.random() * patchSize) - patchSize / 2;
                const offsetY = Math.floor(Math.random() * patchSize) - patchSize / 2;
                const col = startCol + offsetX;
                const row = startRow + offsetY;

                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const index = this.getIndex(col, row);
                    if (this.grid[index] === TERRAIN_IDS['grassland']) {
                        this.grid[index] = terrainId;
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

    /**
     * Obtiene el tipo de terreno como string (para compatibilidad)
     */
    getTerrainAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 'grassland';
        }

        const index = this.getIndex(col, row);
        const id = this.grid[index];
        return ID_TO_TERRAIN[id] || 'grassland';
    }

    /**
     * Obtiene directamente los datos del terreno en (x, y)
     * Optimizado para evitar asignaciones de strings y búsquedas en hash map
     */
    getTerrainDataAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return this._terrainDataCache[0]; // Default to grassland
        }

        const index = row * this.cols + col;
        // Uint8Array access is fast
        const terrainId = this.grid[index];
        return this._terrainDataCache[terrainId] || this._terrainDataCache[0];
    }

    getTerrainData(terrainType) {
        return TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.grassland;
    }

    canBuildAt(x, y, widthTiles, heightTiles) {
        for (let i = 0; i < widthTiles; i++) {
            for (let j = 0; j < heightTiles; j++) {
                const checkX = x + (i * this.tileSize);
                const checkY = y + (j * this.tileSize);
                // Usamos la versión optimizada
                const terrainData = this.getTerrainDataAt(checkX, checkY);
                if (!terrainData.buildable) {
                    return false;
                }
            }
        }
        return true;
    }
}
