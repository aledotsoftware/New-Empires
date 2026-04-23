const fs = require('fs');

let content = fs.readFileSync('js/systems/ProductionQueue.js', 'utf8');

const oldCancelAt = `
    cancelAt(index) {
        if (index < 0 || index >= this.queue.length) {
            return null;
        }
        return this.queue.splice(index, 1)[0];
    }
`;

const newCancelAt = `
    cancelAt(index) {
        if (index < 0 || index >= this.queue.length) {
            return null;
        }

        const cancelled = this.queue[index];
        // BOLT OPTIMIZATION: Avoid splice
        let writeIdx = 0;
        const len = this.queue.length;
        for (let i = 0; i < len; i++) {
            if (i !== index) {
                this.queue[writeIdx++] = this.queue[i];
            }
        }
        this.queue.length = writeIdx;

        return cancelled;
    }
`;

content = content.replace(oldCancelAt.trim(), newCancelAt.trim());
fs.writeFileSync('js/systems/ProductionQueue.js', content, 'utf8');
console.log('Patched ProductionQueue.js');
