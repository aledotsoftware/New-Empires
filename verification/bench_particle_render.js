
const { performance } = require('perf_hooks');

// Mock Context2D
class MockContext {
    constructor() {
        this.font = '';
        this.fillStyle = '';
        this.strokeStyle = '';
        this.globalAlpha = 1;
        this.lineWidth = 1;
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

    // Setters that simulate cost
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

// Mock Particle classes (simplified from effects.js)
class Particle {
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

    render(ctx, camera, lastFont) {
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;

        ctx.globalAlpha = this.alpha;

        if (this.emoji) {
            if (this._cachedFont !== lastFont) {
                ctx.font = this._cachedFont;
            }

            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(this.emoji, screenX, screenY);
            ctx.fillStyle = this.color;
            ctx.fillText(this.emoji, screenX, screenY);

            return this._cachedFont;
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();
            return lastFont;
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    render(ctx, camera) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let currentFont = '';

        for (let i = 0; i < this.particles.length; i++) {
            currentFont = this.particles[i].render(ctx, camera, currentFont);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Setup
const system = new ParticleSystem();
const camera = { x: 0, y: 0 };

// Create 10,000 particles
// 50% circle, 50% emoji
// Clustered colors/alphas to simulate real usage (e.g. explosions)
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
for (let i = 0; i < 10000; i++) {
    const isEmoji = i % 2 === 0;
    const color = colors[Math.floor(i / 100) % colors.length]; // Groups of 100 with same color
    const alpha = (Math.floor(i / 50) % 10) / 10; // Groups of 50 with same alpha

    system.particles.push(new Particle(Math.random() * 800, Math.random() * 600, {
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
const ops = ctx._ops;
const stateChanges = ctx._stateChanges;

console.log(`Time: ${time.toFixed(2)}ms`);
console.log(`Total State Changes: ${stateChanges}`);
console.log(`Avg State Changes per Frame: ${(stateChanges / iterations).toFixed(2)}`);
