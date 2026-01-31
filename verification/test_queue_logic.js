
// Mock ProductionQueue based on the actual implementation
class ProductionQueue {
    constructor(building, maxSize = 5) {
        this.building = building;
        this.queue = [];
        this.maxSize = maxSize;
    }

    get length() {
        return this.queue.length;
    }

    enqueue(unitType, cost, productionTime) {
        if (this.queue.length >= this.maxSize) return false;
        this.queue.push({
            unitType,
            cost,
            remaining: productionTime,
            total: productionTime,
            startTime: Date.now()
        });
        return true;
    }

    cancelAt(index) {
        if (index < 0 || index >= this.queue.length) {
            return null;
        }
        return this.queue.splice(index, 1)[0];
    }

    getQueue() {
        return [...this.queue];
    }
}

// Verification Script
console.log('--- Verifying Queue Logic ---');

// 1. Setup
const queue = new ProductionQueue(null, 5);
const cost1 = { food: 50 };
const cost2 = { wood: 25, gold: 10 };
const cost3 = { food: 100 };

queue.enqueue('villager', cost1, 10); // Index 0 (Active)
queue.enqueue('archer', cost2, 15);   // Index 1
queue.enqueue('warrior', cost3, 20);  // Index 2

console.log(`Initial Queue Length: ${queue.length} (Expected: 3)`);

// 2. Test cancelAt(1) - The middle item
console.log('Cancelling item at index 1 (archer)...');
const cancelled = queue.cancelAt(1);

if (!cancelled) {
    console.error('FAILED: cancelAt returned null');
    process.exit(1);
}

if (cancelled.unitType !== 'archer') {
    console.error(`FAILED: Wrong unit cancelled. Expected archer, got ${cancelled.unitType}`);
    process.exit(1);
}

console.log(`Cancelled Unit: ${cancelled.unitType}`);
console.log(`Refund Check: Wood=${cancelled.cost.wood}, Gold=${cancelled.cost.gold}`);

if (cancelled.cost.wood !== 25 || cancelled.cost.gold !== 10) {
    console.error('FAILED: Incorrect cost returned');
    process.exit(1);
}

// 3. Verify Queue State
console.log(`New Queue Length: ${queue.length} (Expected: 2)`);
const newQueue = queue.getQueue();
if (newQueue[0].unitType !== 'villager') {
    console.error('FAILED: Index 0 changed unexpectedly');
    process.exit(1);
}
if (newQueue[1].unitType !== 'warrior') {
    console.error('FAILED: Index 1 is not warrior (shift failed)');
    process.exit(1);
}

console.log('✅ Queue Logic Verified Successfully');
