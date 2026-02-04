
// Mock DOM
global.document = {
    getElementById: (id) => {
        if (id === 'gameCanvas' || id === 'minimapCanvas') {
            return {
                getContext: () => ({
                    createImageData: () => ({ data: { buffer: new ArrayBuffer(100) } }),
                    putImageData: () => {},
                    drawImage: () => {},
                    clearRect: () => {},
                    beginPath: () => {},
                    fill: () => {},
                    stroke: () => {},
                    save: () => {},
                    restore: () => {},
                    translate: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    rect: () => {},
                    clip: () => {},
                    scale: () => {},
                    rotate: () => {},
                    closePath: () => {},
                    arc: () => {},
                    measureText: () => ({ width: 0 }),
                    fillText: () => {},
                    strokeText: () => {},
                    setLineDash: () => {},
                }),
                width: 800,
                height: 600,
                parentElement: { clientWidth: 800, clientHeight: 600 },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
                style: {},
                addEventListener: () => {}
            };
        }

        const el = {
            style: {},
            classList: { add: () => {}, remove: () => {}, contains: () => false },
            addEventListener: () => {},
            removeChild: (child) => {
                const idx = el.children.indexOf(child);
                if (idx > -1) {
                    el.children.splice(idx, 1);
                    el.childElementCount--;
                }
            },
            setAttribute: () => {},
            removeAttribute: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            dataset: {},
            parentNode: { removeChild: () => {} },
            children: [],
            childElementCount: 0,
            innerHTML: '',
            appendChild: (child) => {
                el.children.push(child);
                el.childElementCount++;
            }
        };
        return el;
    },
    getElementsByClassName: (className) => [],
    createTextNode: (text) => ({ text }),
    createElement: (tag) => {
        return {
            getContext: () => ({
                createImageData: () => ({ data: { buffer: new ArrayBuffer(100) } }),
                putImageData: () => {},
                drawImage: () => {},
                clearRect: () => {}
            }),
            style: {},
            classList: { add: () => {}, remove: () => {} },
            appendChild: () => {},
            width: 0,
            height: 0,
            parentNode: { removeChild: () => {} },
            setAttribute: () => {},
            removeAttribute: () => {},
            dataset: {},
            innerHTML: '',
            onclick: null
        };
    },
    body: {
        appendChild: () => {},
        style: {}
    },
    addEventListener: () => {}
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 800,
    innerHeight: 600
};

global.Image = class { constructor() { this.src = ''; this.complete = false; } };
global.Path2D = class { constructor() {} rect() {} moveTo() {} lineTo() {} };

// Mock global managers
global.civilizationManager = {
    getCivilization: () => ({}),
    getStartingResources: () => ({}),
    getTeamColor: () => '#000000'
};
global.TechManager = class { constructor() {} update() {} getAvailableTechsForBuilding() { return []; } };
global.ProceduralMapGenerator = class { constructor() {} generate() { return { terrainTypes: [], heightmap: [], resources: [], playerStarts: [], decorations: [], metadata: {} }; } };
global.soundManager = { play: () => {} };
global.assetLoader = { getImage: () => null, getSrc: () => null };

import { Game } from '../js/core/Game.js';

try {
    const game = new Game();
    console.log('Game instantiated successfully');

    // Clear initial entities
    game.units = [];
    game.buildings = [];
    game.enemies = [];
    game.entities = [];

    // Populate with dummies
    for (let i = 0; i < 5; i++) game.units.push({ id: `u${i}`, type: 'unit' });
    for (let i = 0; i < 3; i++) game.buildings.push({ id: `b${i}`, type: 'building' });
    for (let i = 0; i < 4; i++) game.enemies.push({ id: `e${i}`, type: 'enemy' });

    // Call rebuild
    game._rebuildEntities();

    // Verify
    const total = game.units.length + game.buildings.length + game.enemies.length;
    if (game.entities.length !== total) {
        throw new Error(`Entities length mismatch. Expected ${total}, got ${game.entities.length}`);
    }

    // Verify order: units, then buildings, then enemies
    const expected = [...game.units, ...game.buildings, ...game.enemies];
    for (let i = 0; i < total; i++) {
        if (game.entities[i] !== expected[i]) {
             throw new Error(`Entity mismatch at index ${i}. Expected ${expected[i].id}, got ${game.entities[i].id}`);
        }
    }

    console.log('Verification successful: _rebuildEntities correctly populated entities.');

} catch (e) {
    console.error('Verification failed:', e);
    process.exit(1);
}
