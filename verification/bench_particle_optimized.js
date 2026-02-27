
const { performance } = require('perf_hooks');

class MockContext {
    constructor() {
        this._font = '';
        this._fillStyle = '';
        this._strokeStyle = '';
        this._globalAlpha = 1;
        this._lineWidth = 1;
        this._ops = 0;
        this._stateChanges = 0;
    }

    save() { this._ops++; }
    restore() { this._ops++; }
    beginPath() { this._ops++; }
    closePath() { this._ops++; }
    arc() { this._ops++; }
    rect() { this._ops++; }
    fillRect() { this._ops++; }
    fill() { this._ops++; }
    stroke() { this._ops++; }
    strokeText() { this._ops++; }
    fillText() { this._ops++; }
    moveTo() { this._ops++; }
    lineTo() { this._ops++; }
    ellipse() { this._ops++; }

    set font(v) { this._font = v; this._stateChanges++; }
    get font() { return this._font; }

    set fillStyle(v) { this._fillStyle = v; this._stateChanges++; }
    get fillStyle() { return this._fillStyle; }

    set strokeStyle(v) { this._strokeStyle = v; this._stateChanges++; }
    get strokeStyle() { return this._strokeStyle; }

    set globalAlpha(v) { this._globalAlpha = v; this._stateChanges++; }
    get globalAlpha() { return this._globalAlpha; }

    set lineWidth(v) { this._lineWidth = v; this._stateChanges++; }
    get lineWidth() { return this._lineWidth; }
}

class ParticleOptimized {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.color = config.color || '#ff6b6b';
        this.size = config.size || 5;
        this.alpha = config.alpha !== undefined ? config.alpha : 1;
        this.emoji = config.emoji || null;
        if (this.emoji) {
             const fontSize = (this.size + 0.5) | 0;
            this._cachedFont = `bold ${fontSize}px Arial`;
        }
    }

    render(ctx, camera, state) {
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;

        if (this.alpha !== state.alpha) {
            ctx.globalAlpha = this.alpha;
            state.alpha = this.alpha;
        }

        if (this.emoji) {
            if (this._cachedFont !== state.font) {
                ctx.font = this._cachedFont;
                state.font = this._cachedFont;
            }

            // Constant for emoji outline
            if (state.lineWidth !== 3) {
                ctx.lineWidth = 3;
                state.lineWidth = 3;
            }
            const strokeColor = 'rgba(0,0,0,0.8)';
            if (state.strokeStyle !== strokeColor) {
                ctx.strokeStyle = strokeColor;
                state.strokeStyle = strokeColor;
            }

            ctx.strokeText(this.emoji, screenX, screenY);

            if (this.color !== state.fillStyle) {
                ctx.fillStyle = this.color;
                state.fillStyle = this.color;
            }
            ctx.fillText(this.emoji, screenX, screenY);

        } else {
            if (this.color !== state.fillStyle) {
                ctx.fillStyle = this.color;
                state.fillStyle = this.color;
            }
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class ParticleSystemOptimized {
    constructor() {
        this.particles = [];
        // Reused state object
        this.renderState = {
            font: '',
            fillStyle: '',
            strokeStyle: '',
            alpha: 1,
            lineWidth: 1
        };
    }

    render(ctx, camera) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Reset state tracker to match context defaults or unknown state
        // Since we did ctx.save(), values are reset to whatever they were before render() was called.
        // But inside render loop we assume we track them.
        // Ideally we sync with actual context, but hard to know.
        // We can force set first time or assume specific defaults.
        // Let's assume we reset tracked state to "unknown" or specific values if we enforce them.

        // Strategy: We don't touch context at start, so we must assume tracked state is invalid
        this.renderState.font = null;
        this.renderState.fillStyle = null;
        this.renderState.strokeStyle = null;
        this.renderState.alpha = null;
        this.renderState.lineWidth = null;

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].render(ctx, camera, this.renderState);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Setup
const system = new ParticleSystemOptimized();
const camera = { x: 0, y: 0 };

const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
for (let i = 0; i < 10000; i++) {
    const isEmoji = i % 2 === 0;
    const color = colors[Math.floor(i / 100) % colors.length];
    const alpha = (Math.floor(i / 50) % 10) / 10;

    system.particles.push(new ParticleOptimized(Math.random() * 800, Math.random() * 600, {
        color: color,
        alpha: alpha,
        emoji: isEmoji ? '💥' : null,
        size: 10 + (Math.random() * 5)
    }));
}

const ctx = new MockContext();

// Benchmark
const iterations = 100;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
    system.render(ctx, camera);
}

const end = performance.now();
const time = end - start;
const stateChanges = ctx._stateChanges;

console.log(`Time: ${time.toFixed(2)}ms`);
console.log(`Total State Changes: ${stateChanges}`);
console.log(`Avg State Changes per Frame: ${(stateChanges / iterations).toFixed(2)}`);
