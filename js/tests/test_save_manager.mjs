import { SaveManager } from '../managers/SaveManager.js';

function mockGame() {
    return {
        units: [{ type: 'villager', x: 10, y: 10, hp: 50, team: 'player', isUnit: true, state: 'IDLE' }],
        buildings: [{ type: 'house', x: 20, y: 20, hp: 100, team: 'player', isBuilding: true, isUnderConstruction: false, widthTiles: 2, heightTiles: 2, gridCol: 1, gridRow: 1 }],
        enemies: [],
        resourceNodes: [{ type: 'wood', x: 100, y: 100, amount: 500, radius: 20 }],
        fow: { grid: new Uint8Array([0, 1, 2]) },
        civilizationId: 'test_civ',
        gameStartTime: Date.now() - 50000,
        resources: { wood: 100, food: 100, gold: 0, stone: 0 },
        populationManager: { population: 1, maxPopulation: 10 },
        camera: { x: 0, y: 0 },
        mapConfig: { width: 50, height: 50, seed: 123 },
        techManager: { researchedTechs: new Set(['tech1']) }
    };
}

async function testSaveManager() {
    console.log("Testing SaveManager...");
    const saveManager = new SaveManager();
    const game = mockGame();

    const serialized = saveManager._serializeGameState(game);

    if (serialized.units.length !== 1) throw new Error("Units not serialized correctly");
    if (serialized.buildings.length !== 1) throw new Error("Buildings not serialized correctly");
    if (serialized.resourceNodes.length !== 1) throw new Error("Resource nodes not serialized correctly");
    if (serialized.fowGrid.length !== 3) throw new Error("FowGrid not serialized correctly");
    if (serialized.civilizationId !== 'test_civ') throw new Error("Civ ID not serialized correctly");

    // Techs should be array
    if (!Array.isArray(serialized.researchedTechs) || serialized.researchedTechs[0] !== 'tech1') {
        throw new Error("Researched techs not serialized to array correctly");
    }

    console.log("SaveManager serialization logic is valid!");
}

testSaveManager();
