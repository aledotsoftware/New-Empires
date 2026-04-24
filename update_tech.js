const fs = require('fs');
const file = 'js/systems/TechManager.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    update(deltaTime) {
        for (let i = this.researchQueue.length - 1; i >= 0; i--) {
            const item = this.researchQueue[i];
            item.timer -= deltaTime;

            if (item.timer <= 0) {
                this.completeResearch(item.techId);
                this.researchQueue.splice(i, 1);
            }
        }
    }`;

const replace = `    update(deltaTime) {
        // BOLT OPTIMIZATION: In-place array removal to avoid splice allocations
        let writeIdx = 0;
        const len = this.researchQueue.length;
        for (let i = 0; i < len; i++) {
            const item = this.researchQueue[i];
            item.timer -= deltaTime;

            if (item.timer <= 0) {
                this.completeResearch(item.techId);
            } else {
                this.researchQueue[writeIdx++] = item;
            }
        }
        this.researchQueue.length = writeIdx;
    }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('TechManager.js updated successfully.');
} else {
    console.log('Search block not found.');
}
