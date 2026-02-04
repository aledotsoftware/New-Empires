
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
                style: {}
            };
        }
        return {
            style: {},
            classList: { add: () => {}, remove: () => {}, contains: () => false },
            addEventListener: () => {},
            appendChild: () => {},
            removeChild: () => {},
            setAttribute: () => {},
            removeAttribute: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            dataset: {},
            parentNode: { removeChild: () => {} }
        };
    },
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
            height: 0
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

    // Check if _rebuildEntities exists (it shouldn't yet)
    if (typeof game._rebuildEntities === 'function') {
        console.log('_rebuildEntities exists');
    } else {
        console.log('_rebuildEntities does not exist');
    }
} catch (e) {
    console.error('Instantiation failed:', e);
}
