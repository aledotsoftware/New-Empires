
import { Game } from '../js/core/Game.js';
import { Unit } from '../js/entities/Unit.js';

// Mock Browser Environment
const noop = () => {};
global.window = {
    addEventListener: noop,
    removeEventListener: noop,
    innerWidth: 800,
    innerHeight: 600
};

const mockContext = {
    clearRect: noop,
    drawImage: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    createImageData: () => ({ data: { buffer: new ArrayBuffer(100) } }),
    putImageData: noop,
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    measureText: () => ({ width: 0 }),
    setLineDash: noop,
    arc: noop,
    rect: noop,
    strokeRect: noop,
    fillRect: noop,
    roundRect: noop
};

const createMockElement = (tag = 'DIV') => {
    const children = [];
    const el = {
        tagName: tag.toUpperCase(),
        children: children,
        dataset: {},
        style: {},
        classList: {
            add: noop,
            remove: noop,
            contains: () => false
        },
        appendChild: (child) => { children.push(child); },
        removeChild: (child) => {
            const idx = children.indexOf(child);
            if (idx > -1) children.splice(idx, 1);
        },
        setAttribute: noop,
        removeAttribute: noop,
        querySelector: () => null,
        querySelectorAll: () => [],
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        addEventListener: noop,
        parentElement: { clientWidth: 800, clientHeight: 600 },
        getContext: () => mockContext,
        width: 800,
        height: 600,
        parentNode: { removeChild: noop }
    };

    Object.defineProperty(el, 'childElementCount', {
        get: () => children.length
    });

    Object.defineProperty(el, 'innerHTML', {
        set: (val) => {
            if (val === '') children.length = 0;
        },
        get: () => ''
    });

    Object.defineProperty(el, 'textContent', {
        set: (val) => {},
        get: () => ''
    });

    return el;
};

global.document = {
    getElementById: (id) => createMockElement('DIV'),
    createElement: (tag) => createMockElement(tag),
    createTextNode: (text) => ({ textContent: text }),
    body: createMockElement('BODY'),
    addEventListener: noop,
    activeElement: { focus: noop },
    getElementsByClassName: () => []
};

// Mock Globals expected by Game.js
global.civilizationManager = {
    getCivilization: () => ({}),
    getStartingResources: () => ({}),
    getTeamColor: () => '#000000',
    applyBuildingBonuses: () => {},
    applyUnitBonuses: () => {}
};
global.TechManager = class {
    constructor() {}
    update() {}
};
global.ProceduralMapGenerator = class {
    constructor() {}
    generate() { return { terrainTypes: [], resources: [], heightmap: [], metadata: { seed: 123 } }; }
};
global.soundManager = { play: noop };
global.assetLoader = { getImage: () => null, getSrc: () => null };
global.Path2D = class { rect() {} moveTo() {} lineTo() {} };
global.Image = class { src = ''; complete = true; };

// Setup Game
const game = new Game();

// Add 5000 units (stress test)
console.log("Spawning 5000 units...");
for (let i = 0; i < 5000; i++) {
    // Cluster them a bit to create hotspots
    const x = Math.random() * 6400;
    const y = Math.random() * 6400;
    const unit = new Unit(x, y, 'player');
    unit.size = 32;
    // Mock terrain props
    unit._lastGridCol = (x / 32) | 0;
    unit._lastGridRow = (y / 32) | 0;

    game.entities.push(unit);
    game.units.push(unit);
    game.playerUnitGrid.add(unit);
}
game._rebuildEntities();

// Benchmark
const iterations = 5000;
console.log(`Running ${iterations} queries on getEntityAt...`);

const start = performance.now();
let hits = 0;

for (let i = 0; i < iterations; i++) {
    const x = Math.random() * 6400;
    const y = Math.random() * 6400;
    const ent = game.getEntityAt(x, y);
    if (ent) hits++;
}

const end = performance.now();
const totalTime = end - start;
console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
console.log(`Avg Time: ${(totalTime / iterations).toFixed(4)}ms`);
console.log(`Hits: ${hits}`);
