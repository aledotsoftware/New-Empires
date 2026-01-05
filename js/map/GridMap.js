/**
 * GridMap - Sistema de cuadrícula para construcción y colisiones
 * Gestiona la ocupación del espacio en el mapa mediante una rejilla de tiles
 */
export class GridMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.ceil(width / tileSize);
        this.rows = Math.ceil(height / tileSize);
        this.grid = new Array(this.cols * this.rows).fill(null);
        // Optimización: Cache inverso para usar multiplicación en lugar de división
        this.invTileSize = 1 / tileSize;
    }

    getIndex(col, row) {
        return row * this.cols + col;
    }

    isAreaFree(startCol, startRow, widthTiles, heightTiles) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
                if (this.grid[this.getIndex(c, r)] !== null) return false;
            }
        }
        return true;
    }

    occupyArea(startCol, startRow, widthTiles, heightTiles, entity) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.grid[this.getIndex(c, r)] = entity;
                }
            }
        }
    }

    freeArea(startCol, startRow, widthTiles, heightTiles) {
        for (let r = startRow; r < startRow + heightTiles; r++) {
            for (let c = startCol; c < startCol + widthTiles; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.grid[this.getIndex(c, r)] = null;
                }
            }
        }
    }

    snapToGrid(x, y) {
        // Optimización: usar multiplicación en lugar de división
        const col = Math.floor(x * this.invTileSize);
        const row = Math.floor(y * this.invTileSize);
        return {
            x: col * this.tileSize,
            y: row * this.tileSize,
            col,
            row
        };
    }
}
