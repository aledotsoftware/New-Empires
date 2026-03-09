import { TerrainMap } from '../js/map/TerrainMap.js';

const terrainMap = new TerrainMap(6400, 6400, 32);

// Baseline
function canBuildAtBaseline(x, y, widthTiles, heightTiles) {
    for (let i = 0; i < widthTiles; i++) {
        for (let j = 0; j < heightTiles; j++) {
            const checkX = x + (i * terrainMap.tileSize);
            const checkY = y + (j * terrainMap.tileSize);

            const terrainData = terrainMap.getTerrainDataAt(checkX, checkY);
            if (!terrainData.buildable) {
                return false;
            }
        }
    }
    return true;
}

// Optimized
function canBuildAtOptimized(x, y, widthTiles, heightTiles) {
    const colStart = (x * terrainMap.invTileSize) | 0;
    const rowStart = (y * terrainMap.invTileSize) | 0;

    for (let c = colStart; c < colStart + widthTiles; c++) {
        for (let r = rowStart; r < rowStart + heightTiles; r++) {
            const terrainData = terrainMap.getTerrainDataByGrid(c, r);
            if (!terrainData.buildable) {
                return false;
            }
        }
    }
    return true;
}


const iter = 1000000;
let x = 100, y = 100, w = 5, h = 5;

let sum1 = 0;
let sum2 = 0;

console.time('Baseline');
for (let i=0; i<iter; i++) {
    sum1 += canBuildAtBaseline(x+i%100, y+i%100, w, h) ? 1 : 0;
}
console.timeEnd('Baseline');

console.time('Optimized');
for (let i=0; i<iter; i++) {
    sum2 += canBuildAtOptimized(x+i%100, y+i%100, w, h) ? 1 : 0;
}
console.timeEnd('Optimized');

console.log(sum1, sum2);
