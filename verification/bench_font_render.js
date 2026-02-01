const { performance } = require('perf_hooks');

class MockContext {
    constructor() {
        this._font = '10px sans-serif';
        this.textAlign = 'start';
        this.textBaseline = 'alphabetic';
    }

    get font() { return this._font; }
    set font(val) {
        // Simulate parsing cost + string allocation
        this._font = val;
        // Simple heuristic: setting property has overhead
        // In real browser, this triggers CSS parser
    }
}

function benchFloatFont() {
    const ctx = new MockContext();
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
        // Random float size
        const size = Math.random() * 5 + 10;
        ctx.font = `bold ${size}px Arial`;
    }
    return performance.now() - start;
}

function benchIntFont() {
    const ctx = new MockContext();
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
        // Integer size (simulate snapped)
        const size = (Math.random() * 5 + 10) | 0;
        ctx.font = `bold ${size}px Arial`;
    }
    return performance.now() - start;
}

function benchCachedFont() {
    const ctx = new MockContext();
    const start = performance.now();
    let lastFont = '';
    for (let i = 0; i < 100000; i++) {
        const size = (Math.random() * 5 + 10) | 0;
        const font = `bold ${size}px Arial`;
        // Check before set
        if (lastFont !== font) {
            ctx.font = font;
            lastFont = font;
        }
    }
    return performance.now() - start;
}

console.log('--- Font Setting Benchmark (JS Overhead Only) ---');
console.log('Note: Real browser impact is significantly higher due to CSS parsing and Glyph caching.');

const floatTime = benchFloatFont();
console.log(`Float sizes: ${floatTime.toFixed(2)}ms`);

const intTime = benchIntFont();
console.log(`Integer sizes: ${intTime.toFixed(2)}ms`);

const cachedTime = benchCachedFont();
console.log(`Cached check: ${cachedTime.toFixed(2)}ms`);
