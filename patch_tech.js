const fs = require('fs');

let content = fs.readFileSync('js/systems/TechManager.js', 'utf8');

const oldUpdate = `
    update(deltaTime) {
        for (let i = this.researchQueue.length - 1; i >= 0; i--) {
            const item = this.researchQueue[i];
            item.timer -= deltaTime;

            if (item.timer <= 0) {
                this.completeResearch(item.techId);
                this.researchQueue.splice(i, 1);
            }
        }
    }
`;

const newUpdate = `
    update(deltaTime) {
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
        if (writeIdx !== len) {
            this.researchQueue.length = writeIdx;
        }
    }
`;

content = content.replace(oldUpdate.trim(), newUpdate.trim());
fs.writeFileSync('js/systems/TechManager.js', content, 'utf8');
console.log('Patched TechManager.js');
