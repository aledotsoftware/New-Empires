// ==========================================
// SISTEMA DE PARTÍCULAS Y EFECTOS VISUALES
// ==========================================

class Particle {
    // BOLT OPTIMIZATION: Object Pool to reduce GC pressure
    static pool = [];

    static get(x, y, config) {
        if (this.pool.length > 0) {
            const p = this.pool.pop();
            p.reset(x, y, config);
            return p;
        }
        return new Particle(x, y, config);
    }

    static release(p) {
        this.pool.push(p);
    }

    constructor(x, y, config = {}) {
        this.reset(x, y, config);
    }

    reset(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx !== undefined ? config.vx : (Math.random() - 0.5) * 100;
        this.vy = config.vy !== undefined ? config.vy : (Math.random() - 0.5) * 100;
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

        // BOLT OPTIMIZATION: Pre-calculate font string
        if (this.emoji) {
            const fontSize = (this.size + 0.5) | 0;
            this._cachedFont = `bold ${fontSize}px Arial`;
        } else {
            this._cachedFont = null;
        }
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

    render(ctx, camera, state) {
        // BOLT OPTIMIZATION: Truncate to integer
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;

        // BOLT OPTIMIZATION: Cache Canvas State
        // Only set alpha if it changed
        if (state.alpha !== this.alpha) {
            ctx.globalAlpha = this.alpha;
            state.alpha = this.alpha;
        }

        if (this.emoji) {
            // BOLT OPTIMIZATION: Only set font if changed
            if (state.font !== this._cachedFont) {
                ctx.font = this._cachedFont;
                state.font = this._cachedFont;
            }

            // Constant styles for emoji outline
            // Palette: Outline for visibility against any background
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

            // Palette: Fill with specific color
            if (state.fillStyle !== this.color) {
                ctx.fillStyle = this.color;
                state.fillStyle = this.color;
            }
            ctx.fillText(this.emoji, screenX, screenY);

        } else {
            if (state.fillStyle !== this.color) {
                ctx.fillStyle = this.color;
                state.fillStyle = this.color;
            }

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

    render(ctx, camera, state) {
        // BOLT OPTIMIZATION: Truncate to integer
        const screenX = (this.x - camera.x) | 0;
        const screenY = (this.y - camera.y) | 0;

        // BOLT OPTIMIZATION: Cache Canvas State
        if (state.strokeStyle !== this.color) {
            ctx.strokeStyle = this.color;
            state.strokeStyle = this.color;
        }

        if (state.lineWidth !== this.lineWidth) {
            ctx.lineWidth = this.lineWidth;
            state.lineWidth = this.lineWidth;
        }

        if (state.alpha !== this.alpha) {
            ctx.globalAlpha = this.alpha;
            state.alpha = this.alpha;
        }

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
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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

    // Efecto de daño en edificios (humo y fuego)
    createBuildingDamageEffect(x, y, severity) {
        // severity: 0 a 1 (0 es apenas dañado, 1 es destruido)
        const count = Math.floor(severity * 5) + 1; // Más daño = más partículas

        for (let i = 0; i < count; i++) {
            const isFire = Math.random() < severity * 0.7; // Más daño = más fuego vs humo
            const angle = (Math.random() - 0.5) * Math.PI; // Mayormente hacia arriba
            const speed = Math.random() * 40 + 10;

            // Variación de colores
            const smokeColors = ['#555555', '#777777', '#333333'];
            const fireColors = ['#ff6b6b', '#ff9f43', '#feca57'];
            const color = isFire ? fireColors[Math.floor(Math.random() * fireColors.length)] : smokeColors[Math.floor(Math.random() * smokeColors.length)];
            const size = isFire ? Math.random() * 4 + 2 : Math.random() * 8 + 4;

            this.particles.push(Particle.get(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20, // Tendencia a subir
                life: Math.random() * 1.5 + 0.5,
                size: size,
                color: color,
                gravity: -10, // Sube como humo
                friction: 0.95,
                fadeRate: 1.2,
                shape: isFire ? 'circle' : 'square' // Humo cuadrado, fuego redondo
            }));
        }

        // Escombros si el daño es muy severo (cayendo)
        if (severity > 0.8 && Math.random() < 0.3) {
            for (let i = 0; i < 3; i++) {
                this.particles.push(Particle.get(x, y, {
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 50 - 50,
                    life: Math.random() * 0.8 + 0.2,
                    size: Math.random() * 6 + 3,
                    color: '#8b6914', // Color piedra/madera oscuro
                    gravity: 150, // Caen rápido
                    friction: 0.98,
                    shape: 'square'
                }));
            }
        }
    }

    // Estelas de proyectiles dinámicas
    createProjectileTrail(x, y, targetX, targetY, color = '#ffffff') {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calcular la velocidad hacia el objetivo
        let vx = (Math.random() - 0.5) * 10;
        let vy = (Math.random() - 0.5) * 10;

        if (dist > 0) {
            // Un proyectil rápido (ej. 400px/s)
            const speed = 400;
            vx = (dx / dist) * speed + (Math.random() - 0.5) * 20;
            vy = (dy / dist) * speed + (Math.random() - 0.5) * 20;
        }

        this.particles.push(Particle.get(x, y, {
            vx: vx,
            vy: vy,
            life: 0.2 + Math.random() * 0.1, // Vida muy corta, ajustada a la distancia
            size: Math.random() * 3 + 2, // Partículas un poco más grandes para que se vean
            color: color,
            gravity: 0,
            friction: 1.0, // Sin fricción para mantener la velocidad
            fadeRate: 2.0 // Desaparecen rápido
        }));
    }

    // Efecto de destello de mina de oro
    createGoldSparkle(x, y) {
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 20 + 10;
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 10,
                life: Math.random() * 0.4 + 0.2,
                size: Math.random() * 4 + 2,
                color: '#fffacd', // LemonChiffon (amarillo/blanco brillante)
                gravity: 0,
                friction: 0.95,
                shape: Math.random() > 0.5 ? 'circle' : 'square',
                fadeRate: 1.5
            }));
        }
    }

    // Efecto de sangre/impacto
    createBloodSplatter(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 30;
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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
            // BOLT OPTIMIZATION: Use Object Pool
            this.particles.push(Particle.get(x, y, {
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

    // Efecto de ataque (Ripple Rojo)
    createAttackRipple(x, y) {
        this.particles.push(new Ripple(x, y, '#c53030'));
    }

    // Efecto de recolección (Ripple Dorado)
    createGatherRipple(x, y) {
        this.particles.push(new Ripple(x, y, '#ecc94b'));
    }

    // Efecto de construcción (Ripple Azul)
    createBuildRipple(x, y) {
        this.particles.push(new Ripple(x, y, '#4299e1'));
    }

    // Efecto de enfoque de cámara (Palette)
    createFocusPing(x, y) {
        // Cyan ripple for focus
        this.particles.push(new Ripple(x, y, '#4299e1'));
        // Smaller secondary ripple for emphasis
        const r = new Ripple(x, y, '#ffffff');
        r.maxSize = 15;
        this.particles.push(r);
    }

    // Efecto de texto flotante (Palette)
    createFloatingText(x, y, text, color = '#fff') {
        // BOLT OPTIMIZATION: Use Object Pool
        this.particles.push(Particle.get(x, y, {
            vx: (Math.random() - 0.5) * 10, // Slight horizontal drift
            vy: -40, // Move up
            life: 1.5,
            size: 14,
            emoji: text, // Abusing emoji property for text
            color: color,
            gravity: 0, // No gravity, float straight up
            friction: 0.98,
            fadeRate: 1.5
        }));
    }

    update(deltaTime) {
        // BOLT OPTIMIZATION: In-place removal to avoid Array allocation (GC pressure)
        // Reduces garbage collection by reusing the existing array
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.update(deltaTime)) {
                this.particles[writeIdx++] = p;
            } else {
                // BOLT OPTIMIZATION: Return to Object Pool
                Particle.release(p);
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

    render(ctx, camera, viewWidth, viewHeight) {
        // BOLT OPTIMIZATION: Single save/restore for the entire system batch
        // Replaces hundreds of per-particle context saves
        ctx.save();

        // BOLT OPTIMIZATION: Hoist common text settings
        // These are only used by emoji particles, but setting them once avoids
        // redundant property access in the loop. Shapes/Ripples ignore them.
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // BOLT OPTIMIZATION: Canvas State Tracking
        // We track the current state of critical context properties to avoid
        // redundant setters (which are expensive in Chrome/V8).
        // Since we just called ctx.save(), we don't know the exact previous values,
        // so we initialize with null to force the first set.
        const state = {
            font: null,
            fillStyle: null,
            strokeStyle: null,
            alpha: null,
            lineWidth: null
        };

        // BOLT OPTIMIZATION: Standard loop avoids iterator allocation
        for (let i = 0; i < this.particles.length; i++) {
            // BOLT OPTIMIZATION: Frustum culling
            // Skip particles outside viewport (with 50px margin)
            if (viewWidth && viewHeight) {
                const p = this.particles[i];
                // Coordinate relative to camera
                const x = p.x - camera.x;
                const y = p.y - camera.y;
                // Check if outside viewport bounds (-50 to width+50)
                if (x < -50 || x > viewWidth + 50 || y < -50 || y > viewHeight + 50) {
                    continue;
                }
            }
            this.particles[i].render(ctx, camera, state);
        }

        // Reset critical state before next batch (future-proofing)
        // Not strictly needed with save/restore but good for safety
        ctx.globalAlpha = 1;
        state.alpha = 1; // Sync state tracker

        for (let i = 0; i < this.projectiles.length; i++) {
            // BOLT OPTIMIZATION: Frustum culling for projectiles
            if (viewWidth && viewHeight) {
                const p = this.projectiles[i];
                const x = p.x - camera.x;
                const y = p.y - camera.y;
                if (x < -50 || x > viewWidth + 50 || y < -50 || y > viewHeight + 50) {
                    continue;
                }
            }

            // Check if projectiles support optimized render (duck typing)
            if (this.projectiles[i].render) {
                // If it accepts state, pass it. If it expects old signature (lastFont),
                // passing an object might break it if it tries to compare string === object.
                // However, grep showed no projectiles currently. Assuming any future projectiles
                // will follow the new pattern or ignore extra args.
                // For safety, we can check arity or just pass state.
                this.projectiles[i].render(ctx, camera, state);
            }
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
