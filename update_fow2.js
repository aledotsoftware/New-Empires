const fs = require('fs');
const file = 'js/map/FogOfWar.js';
let content = fs.readFileSync(file, 'utf8');

const search = `                if (minX <= maxX) {
                    const packed = (minX << 16) | maxX;
                    let rc = this._rowCounts[y];
                    let rbuf = this._rowBuffers[y];

                    if (rc >= rbuf.length) {
                        const newBuffer = new Int32Array(rbuf.length * 2);
                        newBuffer.set(rbuf);
                        this._rowBuffers[y] = newBuffer;
                        rbuf = newBuffer;
                    }

                    rbuf[rc] = packed;
                    this._rowCounts[y] = rc + 1;

                    // Store in cache
                    cache[count++] = y;
                    cache[count++] = packed;
                }`;

const replace = `                if (minX <= maxX) {
                    const packed = (minX << 16) | maxX;
                    let rc = this._rowCounts[y];
                    let rbuf = this._rowBuffers[y];

                    if (rc >= rbuf.length) {
                        const newBuffer = new Int32Array(rbuf.length * 2);
                        newBuffer.set(rbuf);
                        this._rowBuffers[y] = newBuffer;
                        rbuf = newBuffer;
                    }

                    rbuf[rc] = packed;
                    this._rowCounts[y] = rc + 1;

                    // Store in cache
                    cache[count++] = y;
                    cache[count++] = packed;
                }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('FogOfWar.js updated successfully (part 2).');
} else {
    console.log('Search block not found.');
}
