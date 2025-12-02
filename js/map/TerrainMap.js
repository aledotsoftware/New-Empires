import { TERRAIN_TYPES } from '../core/constants.js';

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
        this.grid = new Array(this.cols * this.rows).fill('grassland');

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
                    if (this.grid[index] === 'grassland') {
                        this.grid[index] = terrainType;
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
        return this.grid[index];
    }

    getTerrainData(terrainType) {
        return TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.grassland;
    }

    canBuildAt(x, y, widthTiles, heightTiles) {
        for (let i = 0; i < widthTiles; i++) {
            for (let j = 0; j < heightTiles; j++) {
                const checkX = x + (i * this.tileSize);
                const checkY = y + (j * this.tileSize);
                const terrain = this.getTerrainAt(checkX, checkY);
                const terrainData = this.getTerrainData(terrain);
                if (!terrainData.buildable) {
                    return false;
                }
            }
        }
        return true;
    }
}
