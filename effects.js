// ==========================================
// SISTEMA DE PARTÍCULAS Y EFECTOS VISUALES
// ==========================================

class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || (Math.random() - 0.5) * 100;
        this.vy = config.vy || (Math.random() - 0.5) * 100;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.size = config.size || Math.random() * 5 + 2;
        this.color = config.color || '#ff6b6b';
        this.gravity = config.gravity !== undefined ? config.gravity : 50;
        this.friction = config.friction || 0.98;
        this.alpha = 1;
        this.fadeRate = config.fadeRate || 1;
        this.shape = config.shape || 'circle';
        this.emoji = config.emoji || null;
    }

    update(deltaTime) {
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife) * this.fadeRate;

        return this.life > 0;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // BOLT OPTIMIZATION: Removed per-particle save/restore (handled by system)
        ctx.globalAlpha = this.alpha;

        if (this.emoji) {
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenX, screenY);
        } else {
            ctx.fillStyle = this.color;

            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'square') {
                ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
            } else if (this.shape === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - this.size);
                ctx.lineTo(screenX - this.size, screenY + this.size);
                ctx.lineTo(screenX + this.size, screenY + this.size);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
}

class Ripple {
    constructor(x, y, color = '#48bb78') {
        this.x = x;
        this.y = y;
        this.life = 0.6;
        this.maxLife = 0.6;
        this.size = 2;
        this.maxSize = 20;
        this.color = color;
        this.lineWidth = 3;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        const progress = 1 - (this.life / this.maxLife);
        // Cubic ease out for expansion
        this.size = 2 + (this.maxSize - 2) * (1 - Math.pow(1 - progress, 3));
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // BOLT OPTIMIZATION: Removed per-particle save/restore (handled by system)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        // Flatten y to give 3D perspective effect (ellipse)
        ctx.ellipse(screenX, screenY, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.projectiles = [];
    }

    // Explosión épica
    createExplosion(x, y, color = '#ff6b6b', count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const speed = Math.random() * 150 + 50;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 0.5 + 0.5,
                size: Math.random() * 6 + 2,
                color: color,
                gravity: 100,
                friction: 0.96,
                shape: Math.random() > 0.5 ? 'circle' : 'square'
            }));
        }

        // Partículas secundarias (chispas)
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 0.3 + 0.2,
                size: Math.random() * 3 + 1,
                color: '#ffd700',
                gravity: 50,
                friction: 0.98
            }));
        }
    }

    // Efecto de sangre/impacto
    createBloodSplatter(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 30;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: Math.random() * 0.4 + 0.3,
                size: Math.random() * 4 + 2,
                color: `rgb(${150 + Math.random() * 50}, ${20 + Math.random() * 20}, ${20 + Math.random() * 20})`,
                gravity: 200,
                friction: 0.95
            }));
        }
    }

    // Efecto de construcción (polvo, chispas)
    createConstructionEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 50 + 20;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: Math.random() * 0.8 + 0.5,
                size: Math.random() * 5 + 3,
                color: '#a0a0a0',
                gravity: 30,
                friction: 0.97,
                fadeRate: 0.7
            }));
        }
    }

    // Efecto de recolección de recursos
    createResourceEffect(x, y, resourceType) {
        const emojis = {
            'wood': '🌲',
            'food': '🌾',
            'gold': '💰',
            'stone': '🪨'
        };

        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 100 - 50,
                life: Math.random() * 0.6 + 0.4,
                size: 16,
                emoji: emojis[resourceType] || '✨',
                gravity: -20,
                friction: 0.95,
                fadeRate: 1.5
            }));
        }
    }

    // Efecto de selección
    createSelectionPing(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0.3,
                size: 3,
                color: '#48bb78',
                gravity: 0,
                friction: 0.9
            }));
        }
    }

    // Efecto de movimiento (Ripple)
    createMoveRipple(x, y) {
        this.particles.push(new Ripple(x, y));
    }

    update(deltaTime) {
        // BOLT OPTIMIZATION: In-place removal to avoid Array allocation (GC pressure)
        // Reduces garbage collection by reusing the existing array
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].update(deltaTime)) {
                this.particles[writeIdx++] = this.particles[i];
            }
        }
        this.particles.length = writeIdx;

        writeIdx = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            if (this.projectiles[i].update(deltaTime)) {
                this.projectiles[writeIdx++] = this.projectiles[i];
            }
        }
        this.projectiles.length = writeIdx;
    }

    render(ctx, camera) {
        // BOLT OPTIMIZATION: Single save/restore for the entire system batch
        // Replaces hundreds of per-particle context saves
        ctx.save();

        // BOLT OPTIMIZATION: Standard loop avoids iterator allocation
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].render(ctx, camera);
        }

        // Reset critical state before next batch (future-proofing)
        ctx.globalAlpha = 1;

        for (let i = 0; i < this.projectiles.length; i++) {
            this.projectiles[i].render(ctx, camera);
        }

        ctx.restore();
    }
}

// ==========================================
// SISTEMA DE SONIDO
// ==========================================
class SoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no soportada');
            this.enabled = false;
        }
    }

    playClick() {
        if (!this.enabled) return;
        this.playTone(400, 0.05, 'sine', 0.1);
    }

    playBuild() {
        if (!this.enabled) return;
        this.playTone(200, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(300, 0.1, 'square', 0.15), 50);
    }

    playAttack() {
        if (!this.enabled) return;
        this.playTone(150, 0.08, 'sawtooth', 0.2);
    }

    playHit() {
        if (!this.enabled) return;
        this.playTone(100, 0.06, 'triangle', 0.15);
    }

    playExplosion() {
        if (!this.enabled) return;
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    playGather() {
        if (!this.enabled) return;
        this.playTone(600, 0.05, 'sine', 0.08);
    }

    playSelect() {
        if (!this.enabled) return;
        this.playTone(500, 0.04, 'sine', 0.1);
    }

    playTone(frequency, duration, type = 'sine', vol = 0.1) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(this.volume * vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }
}
