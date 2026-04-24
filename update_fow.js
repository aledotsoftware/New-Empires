const fs = require('fs');
const file = 'js/map/FogOfWar.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    _bufferEntityWithCache(entity, gridX, gridY, radius) {
        // Check cache validity using Grid Coordinates
        if (entity._fowCacheRanges &&
            entity._fowGridX === gridX &&
            entity._fowGridY === gridY &&
            entity._fowRadius === radius) {

            const ranges = entity._fowCacheRanges;
            const buffers = this._rowBuffers;
            // BOLT OPTIMIZATION: Use tracked count to avoid accessing undefined/old data in reused array
            const len = (entity._fowCacheCount !== undefined) ? entity._fowCacheCount : ranges.length;

            // Fast path: Push cached ranges
            for (let i = 0; i < len; i += 2) {
                const r = ranges[i];
                const packed = ranges[i + 1];
                let count = this._rowCounts[r];
                let buffer = this._rowBuffers[r];

                if (count >= buffer.length) {
                    const newBuffer = new Int32Array(buffer.length * 2);
                    newBuffer.set(buffer);
                    this._rowBuffers[r] = newBuffer;
                    buffer = newBuffer;
                }

                buffer[count] = packed;
                this._rowCounts[r] = count + 1;
            }
            return;
        }`;

const replace = `    _bufferEntityWithCache(entity, gridX, gridY, radius) {
        // Check cache validity using Grid Coordinates
        if (entity._fowCacheRanges &&
            entity._fowGridX === gridX &&
            entity._fowGridY === gridY &&
            entity._fowRadius === radius) {

            const ranges = entity._fowCacheRanges;
            const buffers = this._rowBuffers;
            const counts = this._rowCounts;
            // BOLT OPTIMIZATION: Use tracked count to avoid accessing undefined/old data in reused array
            const len = (entity._fowCacheCount !== undefined) ? entity._fowCacheCount : ranges.length;

            // Fast path: Push cached ranges
            for (let i = 0; i < len; i += 2) {
                const r = ranges[i];
                const packed = ranges[i + 1];
                let count = counts[r];
                let buffer = buffers[r];

                if (count >= buffer.length) {
                    const newBuffer = new Int32Array(buffer.length * 2);
                    newBuffer.set(buffer);
                    buffers[r] = newBuffer;
                    buffer = newBuffer;
                }

                buffer[count] = packed;
                counts[r] = count + 1;
            }
            return;
        }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('FogOfWar.js updated successfully.');
} else {
    console.log('Search block not found.');
}
