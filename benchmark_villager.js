
import { Game } from './js/core/Game.js';
import { Villager } from './js/entities/units/Villager.js';
import { CONFIG } from './js/core/constants.js';

// Mock dependencies
global.CONFIG = CONFIG;
global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768
};

const createMockElement = () => ({
    getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        fillText: () => {},
        measureText: () => ({ width: 10 }),
        save: () => {},
        restore: () => {},
        createPattern: () => {},
        setTransform: () => {},
        drawImage: () => {}
    }),
    appendChild: function(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
    },
    style: {},
    parentElement: { clientWidth: 1024, clientHeight: 768 },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    setAttribute: () => {},
    removeAttribute: () => {},
    onclick: null,
    children: [], // Iterable
    dataset: {}, // Mock dataset
    innerHTML: ''
});

const mockElement = createMockElement();

global.document = {
    getElementById: () => createMockElement(), // Always return new for ID lookups to simulate different elements
    createElement: () => createMockElement(),
    body: {
        appendChild: () => {},
        style: {}
    },
    activeElement: null,
    addEventListener: () => {}
};
global.Image = class { constructor() { this.src = ''; this.complete = true; } };

// Mock global managers
global.civilizationManager = {
    getCivilization: () => ({}),
    getStartingResources: () => ({}),
    getTeamColor: () => '#000000',
    getBuildSpeed: () => 1.0,
    applyBuildingBonuses: () => {},
    applyUnitBonuses: () => {}
};
global.TechManager = class { constructor() { } update() { } getAvailableTechsForBuilding() { return []; } canResearch() { return true; } };
global.assetLoader = { getImage: () => new global.Image(), getSrc: () => '' };
global.soundManager = { play: () => {}, playEntitySelection: () => {} };

// Setup Game
const game = new Game();

// Setup scenario
// 1000 buildings, only 2 are drop-off points
for (let i = 0; i < 1000; i++) {
    game.buildings.push({
        type: 'house',
        team: 'player',
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        isDead: false
    });
}
const tc = {
    type: 'townCenter',
    team: 'player',
    x: 100,
    y: 100,
    isDead: false
};
game.buildings.push(tc); // Add at end

const villager = new Villager(500, 500, 'player');
villager.team = 'player';
villager.carryAmount = 10; // Full

// Benchmark
const ITERATIONS = 10000;
const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
    villager.findDropOffAndGo(game);
    // Reset state to force search again
    villager.dropOffTarget = null;
}

const end = performance.now();
console.log(`Time: ${(end - start).toFixed(2)}ms`);
console.log(`Avg per call: ${((end - start) / ITERATIONS).toFixed(4)}ms`);
