
import fs from 'fs';
import vm from 'vm';
import { performance } from 'perf_hooks';

// Mock data
const baseTechnologies = [
    { id: "tech1", name: "Tech 1", cost: { food: 50 } },
    { id: "tech2", name: "Tech 2", cost: { wood: 50 } }
];
const baseUnits = [
    { id: "unit1", name: "Unit 1", cost: { food: 50 }, baseName: "Unit 1 Base" }
];
const civData = {
    name: "Test Civ",
    technologyOverrides: {
        "tech1": { name: "Overridden Tech 1" }
    },
    unitOverrides: {
        "unit1": { name: "Overridden Unit 1" }
    },
    uniqueTechnologies: [],
    uniqueUnit: { id: "unique1", baseUnit: "unit1", name: "Unique Unit" }
};

// Mock fetch
const mockFetch = async (url) => {
    if (url.includes('base_technologies.json')) return { ok: true, json: async () => ({ technologies: baseTechnologies, ages: {}, categories: {} }) };
    if (url.includes('base_buildings.json')) return { ok: true, json: async () => ({ buildings: [] }) };
    if (url.includes('base_units.json')) return { ok: true, json: async () => ({ units: baseUnits }) };
    if (url.includes('romans.json')) return { ok: true, json: async () => civData };
    return { ok: false, status: 404 };
};

// Read dataLoader.js
let code = fs.readFileSync('dataLoader.js', 'utf8');
code += "\n // Export to sandbox\n globalThis.dataLoader = dataLoader; globalThis.DataLoader = DataLoader;";

// Sandbox
const sandbox = {
    fetch: mockFetch,
    console: console,
    debugLogger: {
        debug: () => {},
        error: () => {},
        warn: () => {},
        info: () => {},
        start: () => {},
        time: () => {},
        timeEnd: () => {},
        success: () => {}
    },
    structuredClone: global.structuredClone,
    Map: Map,
    Promise: Promise,
    Date: Date,
    Object: Object,
    Math: Math,
    Array: Array
};

// Execute the code
sandbox.globalThis = sandbox; // Self-reference for globalThis
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const loader = sandbox.dataLoader;
const DataLoader = sandbox.DataLoader;

async function runTest() {
    console.log("Initializing DataLoader...");

    // We need to override AVAILABLE_CIVS to just 'romans' to simplify valid loading
    loader.AVAILABLE_CIVS = ['romans'];

    await loader.initialize();

    console.log("DataLoader initialized.");

    // Test 1: Functionality
    const techs = loader.getTechnologiesForCivilization('romans');
    const t1 = techs.find(t => t.id === 'tech1');
    if (t1.name !== "Overridden Tech 1") {
        throw new Error(`Functionality Check Failed: Expected "Overridden Tech 1", got "${t1.name}"`);
    }
    console.log("✅ Functionality Check Passed");

    // Test 2: Caching Performance
    console.log("Testing Performance...");
    const ITERATIONS = 1000;

    // Warmup
    loader.getTechnologiesForCivilization('romans');

    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        loader.getTechnologiesForCivilization('romans');
    }
    const end = performance.now();
    const duration = end - start;
    console.log(`Duration for ${ITERATIONS} calls: ${duration.toFixed(2)}ms`);

    if (duration > 100) {
        // 1000 calls without cache would likely take >200ms based on my benchmark.
        // With cache it should be <10ms.
        console.warn("⚠️ Performance seems slow. Is caching working?");
    } else {
        console.log("✅ Performance Check Passed (Fast)");
    }

    // Test 3: Cache Integrity (Mutation)
    console.log("Testing Cache Integrity...");
    const units1 = loader.getUnitsForCivilization('romans');

    // units1 should have 2 items: base unit (overridden) and unique unit
    if (units1.length !== 2) {
        throw new Error(`Integrity Check Failed: Expected 2 units, got ${units1.length}`);
    }

    // Mutate the array returned (simulating bad consumer behavior, or legitimate pushing if it wasn't supposed to be cached directly)

    const units2 = loader.getUnitsForCivilization('romans');
    if (units2.length !== 2) {
        console.error("Units 1:", units1);
        console.error("Units 2:", units2);
        throw new Error(`Integrity Check Failed: Subsequent call returned ${units2.length} units (expected 2). Cache might be polluted.`);
    }

    // Verify that modifying units1 doesn't affect units2 (because we return a copy)
    units1.push("Garbage");
    const units3 = loader.getUnitsForCivilization('romans');
    if (units3.length !== 2) {
        throw new Error(`Integrity Check Failed: Modifying returned array affected future calls.`);
    }

    // Test 4: Verify caching actually happened (Whitebox)
    // We can access loader._cache because it's in our sandbox
    if (!loader._cache || loader._cache.size === 0) {
        throw new Error("Whitebox Check Failed: _cache is empty.");
    }
    const techCache = loader._cache.get('tech_romans');
    if (!techCache) {
        throw new Error("Whitebox Check Failed: tech_romans not in cache.");
    }

    console.log("✅ Cache Integrity & Whitebox Check Passed");
}

runTest().catch(e => {
    console.error("❌ Test Failed:", e);
    process.exit(1);
});
