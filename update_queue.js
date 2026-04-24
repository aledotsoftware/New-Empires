const fs = require('fs');
const file = 'js/systems/ProductionQueue.js';
let content = fs.readFileSync(file, 'utf8');

const search = `    enqueue(unitType, cost, productionTime) {
        if (this.isFull()) {
            return false;
        }

        this.queue.push({
            unitType,
            cost,
            remaining: productionTime,
            total: productionTime,
            startTime: Date.now()
        });

        return true;
    }`;

const replace = `    enqueue(unitType, cost, productionTime) {
        if (this.isFull()) {
            return false;
        }

        this.queue[this.queue.length] = {
            unitType,
            cost,
            remaining: productionTime,
            total: productionTime,
            startTime: Date.now()
        };

        return true;
    }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('ProductionQueue.js updated successfully (1).');
} else {
    console.log('Search block 1 not found.');
}

const search2 = `    serialize() {
        const serializedQueue = [];
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            serializedQueue.push({
                unitType: item.unitType,
                cost: item.cost,
                remaining: item.remaining,
                total: item.total
            });
        }`;

const replace2 = `    serialize() {
        const len = this.queue.length;
        const serializedQueue = new Array(len);
        for (let i = 0; i < len; i++) {
            const item = this.queue[i];
            serializedQueue[i] = {
                unitType: item.unitType,
                cost: item.cost,
                remaining: item.remaining,
                total: item.total
            };
        }`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('ProductionQueue.js updated successfully (2).');
} else {
    console.log('Search block 2 not found.');
}

const search3 = `    static deserialize(data, building) {
        const queue = new ProductionQueue(building, data.maxSize);
        for (const item of data.queue) {
            queue.queue.push({
                unitType: item.unitType,
                cost: item.cost || {},
                remaining: item.remaining,
                total: item.total,
                startTime: Date.now() - ((item.total - item.remaining) * 1000)
            });
        }`;

const replace3 = `    static deserialize(data, building) {
        const queue = new ProductionQueue(building, data.maxSize);
        const qData = data.queue || [];
        const len = qData.length;
        queue.queue = new Array(len);
        for (let i = 0; i < len; i++) {
            const item = qData[i];
            queue.queue[i] = {
                unitType: item.unitType,
                cost: item.cost || {},
                remaining: item.remaining,
                total: item.total,
                startTime: Date.now() - ((item.total - item.remaining) * 1000)
            };
        }`;

if (content.includes(search3)) {
    content = content.replace(search3, replace3);
    fs.writeFileSync(file, content);
    console.log('ProductionQueue.js updated successfully (3).');
} else {
    console.log('Search block 3 not found.');
}
