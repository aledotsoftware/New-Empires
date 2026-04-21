const data = new Uint8Array(480 * 480);
data.fill(1); // Explored
for (let i = 0; i < 10000; i++) data[Math.floor(Math.random() * data.length)] = 2; // Visible

const width = 300, height = 300;
const cols = 480, rows = 480;
const scaleX = width / cols;
const scaleY = height / rows;

console.time('Optimized - drawRect');
for (let iter = 0; iter < 100; iter++) {
    // We cannot create Path2D in node, simulating iteration cost
    let ops = 0;
    for (let r = 0; r < rows; r++) {
        const y = r * scaleY;
        const rowOffset = r * cols;
        // Group rectangles on X axis to avoid multiple calls per row!
        let startC = -1;
        let currentState = -1;

        for (let c = 0; c < cols; c++) {
            const state = data[rowOffset + c];
            if (state !== currentState) {
                if (startC !== -1) {
                    if (currentState === 0 || currentState === 1) ops++; // Flush previous
                }
                startC = c;
                currentState = state;
            }
        }
        if (startC !== -1 && (currentState === 0 || currentState === 1)) {
            ops++; // Flush end
        }
    }
}
console.timeEnd('Optimized - drawRect');
