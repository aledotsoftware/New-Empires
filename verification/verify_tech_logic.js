
// Mock structures
const TECHNOLOGIES = {
    'tech1': { id: 'tech1', researchTime: 60 }
};

const game = {
    techManager: {
        researchQueue: [
            { techId: 'tech1', timer: 30 } // 50% remaining
        ]
    }
};

// Global window mock
const window = { game, TECHNOLOGIES };

// Logic to test
function testLogic(techId) {
    const tech = TECHNOLOGIES[techId];
    let percent = 0;
    let remaining = 0;
    let total = 0;

    if (window.game && window.game.techManager && window.game.techManager.researchQueue) {
        const item = window.game.techManager.researchQueue.find(i => i.techId === tech.id);
        if (item) {
            remaining = item.timer;
            // Use total from tech object directly if available, or look up
            total = tech.researchTime || (TECHNOLOGIES[tech.id] ? TECHNOLOGIES[tech.id].researchTime : 1);
            percent = Math.max(0, Math.min(100, (1 - remaining / total) * 100));
        }
    }

    console.log(`Tech: ${techId}`);
    console.log(`Remaining: ${remaining}`);
    console.log(`Total: ${total}`);
    console.log(`Percent: ${percent}`);

    return percent;
}

// Run test
console.log("Testing Tech Logic...");
const p = testLogic('tech1');

if (p === 50) {
    console.log("SUCCESS: Calculation is correct.");
} else {
    console.error("FAILURE: Calculation is incorrect. Expected 50, got " + p);
    process.exit(1);
}
