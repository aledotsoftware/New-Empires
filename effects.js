// ==========================================
// SISTEMA DE PARTÍCULAS Y EFECTOS VISUALES
// ==========================================

class Particle {
    // BOLT OPTIMIZATION: Object Pool to reduce GC pressure


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


    static get(x, y, color = '#48bb78') {
        if (this.pool.length > 0) {
            const p = this.pool.pop();
            p.reset(x, y, color);
            return p;
        }
        return new Ripple(x, y, color);
    }

    static release(p) {
        this.pool.push(p);
    }

    constructor(x, y, color = '#48bb78') {
        this.reset(x, y, color);
    }

    reset(x, y, color = '#48bb78') {
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

    // Efecto de tala de madera (Hojas y astillas)
    createWoodChopEffect(x, y) {
        for (let i = 0; i < 4; i++) {
            const isLeaf = Math.random() > 0.5;
            const angle = (Math.random() - 0.5) * Math.PI; // Hacia arriba
            const speed = Math.random() * 30 + 15;
            this.particles.push(Particle.get(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                life: Math.random() * 0.5 + 0.3,
                size: isLeaf ? Math.random() * 3 + 2 : Math.random() * 4 + 1,
                color: isLeaf ? '#48bb78' : '#8b5a2b', // Verde hoja o marrón madera
                gravity: isLeaf ? 15 : 40, // Las hojas caen más lento
                friction: 0.95,
                shape: isLeaf ? 'circle' : 'square',
                fadeRate: 1.2
            }));
        }
    }

    // Efecto de picar piedra (Polvo gris y chispas blancas)
    createStoneMineEffect(x, y) {
        for (let i = 0; i < 4; i++) {
            const isDust = Math.random() > 0.3;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 25 + 10;
            this.particles.push(Particle.get(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 15,
                life: Math.random() * 0.5 + 0.2,
                size: isDust ? Math.random() * 5 + 3 : Math.random() * 2 + 1,
                color: isDust ? 'rgba(120, 144, 156, 0.8)' : '#ffffff', // Gris piedra o chispa blanca
                gravity: isDust ? -5 : 30, // El polvo sube, la chispa cae
                friction: 0.92,
                shape: isDust ? 'circle' : 'square',
                fadeRate: 1.5
            }));
        }
    }

    // Efecto de recolección de comida (Tierra y hojas)
    createFoodGatherEffect(x, y) {
        for (let i = 0; i < 3; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 20 + 10;
            this.particles.push(Particle.get(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 15,
                life: Math.random() * 0.4 + 0.2,
                size: Math.random() * 3 + 2,
                color: Math.random() > 0.5 ? '#7cb342' : '#5c4d3d', // Verde o marrón tierra
                gravity: 25,
                friction: 0.94,
                shape: 'circle',
                fadeRate: 1.5
            }));
        }
    }

    // Efecto de destrucción total de un edificio (humo, escombros, explosión)
    createBuildingCollapseEffect(x, y, size = 100) {
        // Shockwave expansiva
        const shockwave = Ripple.get(x, y, 'rgba(200, 180, 150, 0.5)');
        shockwave.maxSize = size * 2.5;
        this.particles.push(shockwave);

        // Segunda shockwave más rápida y brillante
        const shockwave2 = Ripple.get(x, y, 'rgba(255, 200, 100, 0.7)');
        shockwave2.maxSize = size * 1.5;
        this.particles.push(shockwave2);

        // Explosión inicial (Flash)
        for (let i = 0; i < 8; i++) {
            this.particles.push(Particle.get(x, y, {
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: Math.random() * 0.4 + 0.1,
                size: Math.random() * size * 0.6 + size * 0.3,
                color: 'rgba(255, 150, 50, 0.9)',
                gravity: 0,
                friction: 0.85,
                fadeRate: 2.5,
                shape: 'circle'
            }));
        }

        // Gran nube de polvo expansiva
        const dustCount = 50;
        for (let i = 0; i < dustCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 40;

            const dustColors = [
                'rgba(180, 160, 140, 0.85)',
                'rgba(150, 130, 110, 0.75)',
                'rgba(200, 180, 160, 0.7)',
                'rgba(120, 100, 80, 0.95)',
                'rgba(80, 70, 60, 0.9)'
            ];

            this.particles.push(Particle.get(x + (Math.random() - 0.5) * size * 0.6, y + (Math.random() - 0.5) * size * 0.6, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30, // Tendencia a subir lentamente
                life: Math.random() * 2.5 + 1.0,
                size: Math.random() * 25 + 10,
                color: dustColors[Math.floor(Math.random() * dustColors.length)],
                gravity: -8,
                friction: 0.92,
                fadeRate: 0.8,
                shape: 'circle'
            }));
        }

        // Escombros pesados volando (pedazos de piedra/madera)
        const debrisCount = 35;
        for (let i = 0; i < debrisCount; i++) {
            const angle = (Math.random() - 0.5) * Math.PI; // Hacia arriba
            const speed = Math.random() * 250 + 120;

            this.particles.push(Particle.get(x + (Math.random() - 0.5) * size * 0.6, y + (Math.random() - 0.5) * size * 0.6, {
                vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 80,
                vy: Math.sin(angle) * speed - 200,
                life: Math.random() * 2.0 + 0.8,
                size: Math.random() * 10 + 4,
                color: Math.random() > 0.5 ? '#5c4a3d' : '#3a2e24', // Tonos de piedra/madera oscura
                gravity: 500, // Caen muy rápido (peso)
                friction: 0.97,
                shape: 'square'
            }));
        }

        // Chispas adicionales de la destrucción
        const sparkCount = 20;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.random() - 0.5) * Math.PI; // Hacia arriba
            const speed = Math.random() * 300 + 150;

            this.particles.push(Particle.get(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 250,
                life: Math.random() * 1.5 + 0.5,
                size: Math.random() * 4 + 2,
                color: '#ffaa00',
                gravity: 200,
                friction: 0.95,
                fadeRate: 1.5,
                shape: 'square'
            }));
        }
    }

    // Efecto de daño en edificios (humo y fuego)
    createBuildingDamageEffect(x, y, severity) {
        // severity: 0 a 1 (0 es apenas dañado, 1 es destruido)
        const count = Math.floor(severity * 12) + 3; // Más partículas para mejor efecto visual

        for (let i = 0; i < count; i++) {
            const isFire = Math.random() < severity * 0.9; // Mayor probabilidad de fuego a más daño
            const angle = (Math.random() - 0.5) * Math.PI; // Mayormente hacia arriba
            const speed = Math.random() * 60 + 20;

            // Variación de colores más realista y vibrante (Medieval Glassmorphism)
            const smokeColors = ['rgba(80, 80, 80, 0.85)', 'rgba(100, 100, 100, 0.75)', 'rgba(40, 40, 40, 0.9)', 'rgba(15, 15, 15, 0.85)'];
            const fireColors = ['rgba(255, 80, 40, 0.9)', 'rgba(255, 140, 20, 0.9)', 'rgba(255, 200, 50, 0.8)', 'rgba(255, 50, 0, 0.95)'];
            const color = isFire ? fireColors[Math.floor(Math.random() * fireColors.length)] : smokeColors[Math.floor(Math.random() * smokeColors.length)];
            const size = isFire ? Math.random() * 10 + 6 : Math.random() * 20 + 10; // Bard: Aumentamos ligeramente el tamaño para más impacto visual

            this.particles.push(Particle.get(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, {
                vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 15, // Algo de turbulencia
                vy: Math.sin(angle) * speed - 50, // Tendencia a subir más rápida (aumentada de 40 a 50)
                life: isFire ? Math.random() * 1.2 + 0.4 : Math.random() * 3.0 + 1.5, // Bard: Aumentamos la vida útil del fuego y humo para mayor inmersión
                size: size,
                color: color,
                gravity: isFire ? -25 : -10, // Bard: El fuego sube ligeramente más rápido
                friction: 0.90,
                fadeRate: isFire ? 1.8 : 0.5, // El fuego se apaga más rápido, el humo se disipa suavemente
                shape: 'circle' // Ambos circulares para difuminar mejor
            }));
        }

        // Escombros y chispas cayendo
        if (severity > 0.2) {
            const debrisCount = Math.floor(severity * 8) + 2;
            for (let i = 0; i < debrisCount; i++) {
                const isSpark = Math.random() > 0.6;
                this.particles.push(Particle.get(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, {
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 150 - 100,
                    life: Math.random() * 2.0 + 0.5,
                    size: isSpark ? Math.random() * 3 + 1 : Math.random() * 8 + 3,
                    color: isSpark ? '#ffaa00' : (Math.random() > 0.5 ? '#5c4a3d' : '#3a2e24'), // Chispas o piedra/madera oscura
                    gravity: isSpark ? 100 : 400, // Escombros caen más rápido que chispas
                    friction: 0.96,
                    shape: 'square'
                }));
            }
        }
    }

    // Estelas de proyectiles dinámicas
    createProjectileTrail(x, y, targetX, targetY, color = 'rgba(255, 255, 255, 0.8)') {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calcular partículas a lo largo de la trayectoria
        const numParticles = Math.min(Math.floor(dist / 8), 20);

        for (let i = 0; i < numParticles; i++) {
            const fraction = i / numParticles;
            // Interpolar posición con ligera parábola para simular caída
            const parabolaY = Math.sin(fraction * Math.PI) * -15; // Elevación máxima en el medio
            const px = x + dx * fraction;
            const py = y + dy * fraction + parabolaY;

            // Variar ligeramente el tiempo de vida para dar efecto de "disparo" continuo
            const baseLife = 0.25; // Bard: Ligeramente más duraderas las estelas
            const lifeOffset = fraction * 0.2; // Las partículas más cercanas al objetivo duran más

            // Mezclar el color base con tonos de estela dorada (Medieval aesthetics)
            const isGold = Math.random() > 0.5; // Bard: Aumentamos la frecuencia de destellos dorados
            const trailColor = isGold ? `rgba(255, ${200 + Math.random() * 55}, 0, ${0.8 + Math.random() * 0.2})` : color; // Bard: Estelas doradas un poco más opacas

            this.particles.push(Particle.get(px + (Math.random() - 0.5) * 6, py + (Math.random() - 0.5) * 6, { // Bard: Ligeramente más dispersión inicial
                vx: dx * 0.1 + (Math.random() - 0.5) * 10, // Ligeramente en la dirección del proyectil con más fuerza
                vy: dy * 0.1 + (Math.random() - 0.5) * 10,
                life: baseLife + lifeOffset,
                size: Math.random() * 4 + 2, // Bard: Estelas ligeramente más grandes
                color: trailColor,
                gravity: 2, // Ligera caída de la estela
                friction: 0.94,
                fadeRate: 1.8, // Bard: Desvanecimiento más suave
                shape: isGold && Math.random() > 0.4 ? 'square' : 'circle' // Variedad de formas para chispas doradas
            }));
        }
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
        this.particles.push(Ripple.get(x, y));
    }

    // Efecto de ataque (Ripple Rojo)
    createAttackRipple(x, y) {
        this.particles.push(Ripple.get(x, y, '#c53030'));
    }

    // Efecto de recolección (Ripple Dorado)
    createGatherRipple(x, y) {
        this.particles.push(Ripple.get(x, y, '#ecc94b'));
    }

    // Efecto de construcción (Ripple Azul)
    createBuildRipple(x, y) {
        this.particles.push(Ripple.get(x, y, '#4299e1'));
    }

    // Efecto de enfoque de cámara (Palette)
    createFocusPing(x, y) {
        // Cyan ripple for focus
        this.particles.push(Ripple.get(x, y, '#4299e1'));
        // Smaller secondary ripple for emphasis
        const r = Ripple.get(x, y, '#ffffff');
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
                if (p instanceof Ripple) {
                    Ripple.release(p);
                } else {
                    Particle.release(p);
                }
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



class SoundSystem {}

Particle.pool = [];
Ripple.pool = [];
