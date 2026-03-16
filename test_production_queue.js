const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});

// Polyfills
dom.window.HTMLCanvasElement.prototype.getContext = function () {
    return {
        clearRect: function () { },
        fillRect: function () { },
        drawImage: function () { },
        save: function () { },
        restore: function () { },
        beginPath: function () { },
        moveTo: function () { },
        lineTo: function () { },
        stroke: function () { },
        fill: function () { },
        arc: function () { },
        rect: function () { },
        fillText: function () { },
        measureText: function () { return { width: 0 }; },
        setLineDash: function () { }
    };
};
dom.window.requestAnimationFrame = function (cb) { return setTimeout(cb, 16); };
dom.window.cancelAnimationFrame = function (id) { clearTimeout(id); };

// Mock audio
dom.window.AudioContext = function() {
    this.createOscillator = () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } });
    this.createGain = () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } });
    this.destination = {};
    this.currentTime = 0;
};
dom.window.Audio = function() {
    this.play = () => Promise.resolve();
    this.pause = () => {};
};

// load scripts
const scripts = [
    'js/core/constants.js',
    'js/utils/DebugLogger.js',
    'js/managers/AssetLoader.js',
    'js/managers/CivilizationManager.js',
    'js/systems/TechManager.js',
    'js/managers/DataLoader.js',
    'js/systems/Refund.js',
    'js/managers/SaveManager.js',
    'js/managers/SoundManager.js',
    'js/managers/PopulationManager.js',
    'js/systems/EffectsManager.js',
    'js/systems/FormationManager.js',
    'js/systems/ProductionQueue.js',
    'js/managers/SpatialGrid.js',
    'js/map/TerrainMap.js',
    'js/map/FogOfWar.js',
    'js/map/GridMap.js',
    'js/map/TerrainDecor.js',
    'js/map/ProceduralMapGenerator.js',
    'js/utils/FocusManager.js',
    'js/entities/Entity.js',
    'js/entities/Unit.js',
    'js/entities/Building.js',
    'js/entities/units/Villager.js',
    'js/entities/units/Warrior.js',
    'js/entities/units/Archer.js',
    'js/entities/units/Spearman.js',
    'js/entities/units/Cavalry.js',
    'js/entities/units/Scout.js',
    'js/entities/units/Priest.js',
    'js/entities/units/Trader.js',
    'js/entities/buildings/TownCenter.js',
    'js/entities/buildings/House.js',
    'js/entities/buildings/Barracks.js',
    'js/entities/buildings/Storage.js',
    'js/entities/buildings/StorageWood.js',
    'js/entities/buildings/Market.js',
    'js/entities/buildings/Temple.js',
    'js/entities/buildings/Workshop.js',
    'js/core/Game.js'
];

let scriptsLoaded = 0;
scripts.forEach(script => {
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = fs.readFileSync(path.join(__dirname, script), 'utf8');
    dom.window.document.body.appendChild(scriptEl);
    scriptsLoaded++;
});

console.log("Scripts loaded.");

// Simulate game
const Game = dom.window.Game;

// Mock dataLoader manually if it failed to load json
dom.window.dataLoader = {
    getUnitData: () => ({ cost: { food: 50 }, buildTime: 10, name: 'Villager', popCost: 1, icon: 'villager' }),
    getBuildingData: () => ({ cost: { wood: 50 }, name: 'House', icon: 'house' }),
    getTechnologyData: () => null,
    getCivilizationData: () => ({ name: 'TestCiv', bonuses: [] }),
    isTechnologyResearched: () => false,
    getAllCivilizations: () => [{ civilizationId: 'test' }]
};

const mapConfig = { width: 50, height: 50, name: 'Tiny' };
const game = new Game('test', mapConfig);

const tc = new dom.window.TownCenter(100, 100, 1, game);
tc.isConstructed = true;
game.entities.push(tc);

// give resources
game.resources = { food: 500, wood: 500, gold: 500, stone: 500 };

game.selectedEntities = [tc];
tc.queueUnit('villager', game);

game.updateSelectionPanel();

console.log("Queue length after queuing:", tc.productionQueue.queue.length);
console.log("Food before cancel:", game.resources.food);

const selectionPanel = dom.window.document.getElementById('selectionPanel');
const cancelBtn = selectionPanel.querySelector('.production-container .btn-close');

if (cancelBtn) {
    console.log("Cancel button found in DOM! Simulating click...");
    cancelBtn.click();
    console.log("Queue length after cancel:", tc.productionQueue.queue.length);
    console.log("Food after cancel:", game.resources.food);
} else {
    console.log("Cancel button not found in DOM.");
    console.log("Selection panel HTML:");
    console.log(selectionPanel.innerHTML);
}
