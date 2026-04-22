import { debugLogger } from "../utils/DebugLogger.js";
// ==========================================
// SOUND MANAGER - Sistema de gestión de sonidos
// ==========================================

// BOLT OPTIMIZATION: Object Pool for Audio elements
// Reduces GC pressure and CPU usage by reusing Audio objects instead of cloning them every time.
export class SoundPool {
    constructor(original, size = 5) {
        this.original = original;
        this.pool = [];
        this.size = size;
        this.idx = 0;

        // Pre-allocate pool
        for (let i = 0; i < size; i++) {
            this.pool.push(original.cloneNode());
        }
    }

    play(volume) {
        // Round-robin strategy: Pick next, reset, play.
        // This ensures O(1) access and naturally limits polyphony (preventing audio chaos).
        const sound = this.pool[this.idx];
        this.idx = (this.idx + 1) % this.size;

        // Reset state
        sound.currentTime = 0;
        sound.volume = volume;

        return sound.play();
    }

    setVolume(volume) {
        // Update volume for all instances (including playing ones)
        for (let i = 0; i < this.size; i++) {
            this.pool[i].volume = volume;
        }
    }
}

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.pools = new Map(); // BOLT OPTIMIZATION: Store pools here
        this.enabled = true;
        this.volume = 0.5; // Volumen por defecto (0.0 a 1.0)
        this.isPlayingMusic = false;

        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no soportada');
        }
    }

    // --- Paisajismo Sonoro ---
    playBiomeAmbient(biomeName) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Evita superposición excesiva si se llama muy seguido (Aumentado de 10s a 15s para reducir fatiga auditiva)
        if (this._lastAmbientTime && now - this._lastAmbientTime < 15) return;
        this._lastAmbientTime = now;

        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.audioContext.destination);

        // Bard: Integrate Weather Sounds over Ambient
        // En Bosque/Agua hay lluvia (drawWeather asume lluvia)
        if (biomeName === 'Bosque' || biomeName === 'Agua') {
            // Lluvia persistente (Ruido blanco + filtro lowpass para amortiguar)
            const bufferSize = this.audioContext.sampleRate * 2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const rainSrc = this.audioContext.createBufferSource();
            rainSrc.buffer = buffer;
            const rainFilter = this.audioContext.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.setValueAtTime(400, now);

            // Añadir un poco de modulación para simular gotas
            const modOsc = this.audioContext.createOscillator();
            modOsc.type = 'sine';
            modOsc.frequency.value = 2; // 2 Hz modulación
            const modGain = this.audioContext.createGain();
            modGain.gain.value = 100;
            modOsc.connect(modGain);
            modGain.connect(rainFilter.frequency);

            rainSrc.connect(rainFilter);
            rainFilter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.015, now + 0.5);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2);

            rainSrc.start(now);
            modOsc.start(now);
            modOsc.stop(now + 2);
        }

        if (biomeName === 'Bosque') {
            // Sintetizar cantos de pájaros y brisa entre las hojas (suavizado y orgánico)
            const birdGain = this.audioContext.createGain();
            const birdOsc = this.audioContext.createOscillator();
            birdOsc.connect(birdGain);
            birdGain.connect(gainNode);
            birdOsc.type = 'sine';

            // Canto de pájaro más orgánico (trino)
            birdOsc.frequency.setValueAtTime(1500, now);
            birdOsc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
            birdOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
            birdOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

            birdGain.gain.setValueAtTime(0.01, now);
            birdGain.gain.linearRampToValueAtTime(this.volume * 0.015, now + 0.1);
            birdGain.gain.linearRampToValueAtTime(0.01, now + 0.4);

            birdOsc.start(now);
            birdOsc.stop(now + 0.4);

            // Añadir una suave brisa de fondo para inmersión
            const bufferSize = this.audioContext.sampleRate * 2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const breezeSrc = this.audioContext.createBufferSource();
            breezeSrc.buffer = buffer;
            const breezeFilter = this.audioContext.createBiquadFilter();
            breezeFilter.type = 'lowpass';
            breezeFilter.frequency.setValueAtTime(200, now);
            breezeFilter.frequency.linearRampToValueAtTime(400, now + 1);

            const breezeGain = this.audioContext.createGain();
            breezeSrc.connect(breezeFilter);
            breezeFilter.connect(breezeGain);
            breezeGain.connect(gainNode);

            breezeGain.gain.setValueAtTime(0.01, now);
            breezeGain.gain.linearRampToValueAtTime(this.volume * 0.008, now + 1); // Muy sutil
            breezeGain.gain.linearRampToValueAtTime(0.01, now + 2);

            breezeSrc.start(now);

        } else if (biomeName === 'Desierto') {
            // Sintetizar viento aullando (ruido blanco + filtro paso banda para "silbido" del viento)
            const bufferSize = this.audioContext.sampleRate * 4; // 4 segundos para un aullido más largo
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;

            // Filtro paso bajo base para el rugido
            const lowFilter = this.audioContext.createBiquadFilter();
            lowFilter.type = 'lowpass';
            lowFilter.frequency.setValueAtTime(150, now);
            lowFilter.frequency.linearRampToValueAtTime(400, now + 2);
            lowFilter.frequency.linearRampToValueAtTime(150, now + 4);

            // Filtro paso banda para el aullido ("howl")
            const howlFilter = this.audioContext.createBiquadFilter();
            howlFilter.type = 'bandpass';
            howlFilter.frequency.setValueAtTime(300, now);
            howlFilter.frequency.exponentialRampToValueAtTime(800, now + 2);
            howlFilter.frequency.exponentialRampToValueAtTime(300, now + 4);
            howlFilter.Q.value = 5; // Resonancia alta para silbido

            noiseSource.connect(lowFilter);
            lowFilter.connect(gainNode);

            noiseSource.connect(howlFilter);
            howlFilter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.02, now + 1.5); // Volumen sutil
            gainNode.gain.linearRampToValueAtTime(0.01, now + 4);

            noiseSource.start(now);
        } else if (biomeName === 'Agua' || biomeName === 'Archipiélago') {
            // Sonido de olas suaves
            const oscillator = this.audioContext.createOscillator();

            // Usar un filtro paso bajo para hacer el sonido del agua más profundo y realista
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            oscillator.connect(filter);
            filter.connect(gainNode);

            // Mezcla de ondas de baja frecuencia
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.linearRampToValueAtTime(50, now + 2.0);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.02, now + 1.0);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2.0);

            oscillator.start(now);
            oscillator.stop(now + 2.0);
        } else if (biomeName === 'Pastizal' || biomeName === 'Pastizales') {
            // Bard: Sonido de viento suave entre el pasto y pequeños grillos (mejorado)
            const cricketOsc = this.audioContext.createOscillator();
            const cricketGain = this.audioContext.createGain();

            cricketOsc.type = 'square';
            // Variar frecuencia para no fatigar
            const baseFreq = 4500 + (Math.random() * 500 - 250);
            cricketOsc.frequency.setValueAtTime(baseFreq, now);
            cricketOsc.frequency.linearRampToValueAtTime(baseFreq + 300, now + 0.1);
            cricketOsc.frequency.linearRampToValueAtTime(baseFreq, now + 0.2);

            cricketGain.gain.setValueAtTime(0, now);
            cricketGain.gain.linearRampToValueAtTime(this.volume * 0.006, now + 0.05); // Ligeramente más audible
            cricketGain.gain.linearRampToValueAtTime(0, now + 0.2);

            cricketOsc.connect(cricketGain);
            cricketGain.connect(gainNode);

            cricketOsc.start(now);
            cricketOsc.stop(now + 0.2);

            // Añadir un segundo grillo asíncrono
            const cricket2Osc = this.audioContext.createOscillator();
            const cricket2Gain = this.audioContext.createGain();
            cricket2Osc.type = 'square';
            cricket2Osc.frequency.setValueAtTime(baseFreq + 800, now + 0.5);
            cricket2Osc.frequency.linearRampToValueAtTime(baseFreq + 1000, now + 0.6);
            cricket2Osc.frequency.linearRampToValueAtTime(baseFreq + 800, now + 0.7);

            cricket2Gain.gain.setValueAtTime(0, now + 0.5);
            cricket2Gain.gain.linearRampToValueAtTime(this.volume * 0.004, now + 0.55);
            cricket2Gain.gain.linearRampToValueAtTime(0, now + 0.7);

            cricket2Osc.connect(cricket2Gain);
            cricket2Gain.connect(gainNode);
            cricket2Osc.start(now + 0.5);
            cricket2Osc.stop(now + 0.7);


            // Suave murmullo de viento
            const bufferSize = this.audioContext.sampleRate * 2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const grassWind = this.audioContext.createBufferSource();
            grassWind.buffer = buffer;

            const grassFilter = this.audioContext.createBiquadFilter();
            grassFilter.type = 'lowpass';
            // Variar el filtro para simular ráfagas
            grassFilter.frequency.setValueAtTime(600, now);
            grassFilter.frequency.linearRampToValueAtTime(900, now + 1);
            grassFilter.frequency.linearRampToValueAtTime(600, now + 2);

            grassWind.connect(grassFilter);
            grassFilter.connect(gainNode);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.012, now + 1);
            gainNode.gain.linearRampToValueAtTime(0, now + 2);

            grassWind.start(now);
        } else if (biomeName === 'Montañas' || biomeName === 'Colinas' || biomeName === 'Montaña' || biomeName === 'Volcánico') {
            // Eco sutil / viento de altura
            const bufferSize = this.audioContext.sampleRate * 2; // 2 segundos
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.5; // Ruido blanco reducido
            }

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(400, now); // Frecuencia media para simular eco
            filter.Q.value = 5.0; // Resonancia alta para el efecto de viento hueco

            noiseSource.connect(filter);
            filter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.015, now + 0.5);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2);

            noiseSource.start(now);
        } else if (biomeName === 'Nieve' || biomeName === 'Tundra') {
            // Viento helado / Tormenta de Nieve
            const bufferSize = this.audioContext.sampleRate * 2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;

            // Filtro para viento frío (ruido agudo silbante)
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.linearRampToValueAtTime(1200, now + 1);
            filter.Q.value = 2;

            noiseSource.connect(filter);
            filter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.015, now + 0.5);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2);

            noiseSource.start(now);
        } else if (biomeName === 'Pantano Venenoso') {
            // Insectos y ranas en el pantano
            const cricketOsc = this.audioContext.createOscillator();
            cricketOsc.type = 'square';
            cricketOsc.frequency.setValueAtTime(800, now);
            cricketOsc.frequency.linearRampToValueAtTime(820, now + 0.1);
            cricketOsc.frequency.linearRampToValueAtTime(800, now + 0.2);

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.linearRampToValueAtTime(1500, now + 0.5);

            cricketOsc.connect(filter);
            filter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.005, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.01, now + 0.5);
            gainNode.gain.linearRampToValueAtTime(0.005, now + 1);

            cricketOsc.start(now);
            cricketOsc.stop(now + 1);
        }
    }

    // --- Sonidos Sintetizados (Acciones Rápidas) ---
    playAttack() {
        if (!this.enabled) return;
        // Bard: Variación de tono (+/- 5%) para evitar fatiga auditiva
        const freq = 150 + (Math.random() * 15 - 7.5);
        this.playTone(freq, 0.08, 'sawtooth', 0.2);
    }

    playArrow() {
        if (!this.enabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;

        // Use a short white noise burst with bandpass filter to simulate an arrow swish
        const bufferSize = this.audioContext.sampleRate * 0.15; // 150ms
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
        filter.Q.value = 1.0;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noiseSource.start(now);
    }

    playHit() {
        if (!this.enabled) return;
        // Bard: Variación de tono (+/- 5%)
        const freq = 100 + (Math.random() * 10 - 5);
        this.playTone(freq, 0.06, 'triangle', 0.15);
    }

    playExplosion() {
        if (!this.enabled) return;
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        const startVol = Math.max(0.01, this.volume * 0.3);
        gainNode.gain.setValueAtTime(startVol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    playGather(resourceType) {
        if (!this.enabled) return;

        // Bard: Variación de tono dinámico para cada recurso (+/- 5 a 10%)
        switch (resourceType) {
            case 'wood':
                // Chop sound (thud)
                this.playTone(150 + (Math.random() * 10 - 5), 0.08, 'square', 0.1);
                break;
            case 'stone':
                // Clink sound (sharp strike)
                this.playTone(400 + (Math.random() * 30 - 15), 0.06, 'triangle', 0.08);
                break;
            case 'gold':
                // Light clink/sparkle (high pitch)
                this.playTone(800 + (Math.random() * 60 - 30), 0.05, 'sine', 0.05);
                break;
            case 'food':
                // Soft gathering sound (rustling/soft pluck)
                this.playTone(200 + (Math.random() * 20 - 10), 0.08, 'sine', 0.06);
                break;
            default:
                // Generic gathering sound
                this.playTone(600 + (Math.random() * 40 - 20), 0.05, 'sine', 0.08);
                break;
        }
    }

    playMilitaryComplete() {
        if (!this.enabled) return;
        // Fanfare for military completion
        this.playTone(300, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(400, 0.15, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(500, 0.25, 'sine', 0.15), 250);
    }

    playVillagerComplete() {
        if (!this.enabled) return;
        // Simple positive chime for villager
        this.playTone(450, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(600, 0.15, 'sine', 0.1), 100);
    }

    playAlarm() {
        if (!this.enabled) return;
        // Warning alarm
        this.playTone(600, 0.2, 'square', 0.15);
        setTimeout(() => this.playTone(600, 0.2, 'square', 0.15), 300);
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

        const startVol = Math.max(0.01, this.volume * vol);
        gainNode.gain.setValueAtTime(startVol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    /**
     * Carga un archivo de sonido
     * @param {string} key - Identificador del sonido
     * @param {string} src - Ruta del archivo de sonido
     */
    loadSound(key, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = src;
            audio.volume = this.volume;

            audio.addEventListener('canplaythrough', () => {
                this.sounds[key] = audio;
                // BOLT OPTIMIZATION: Initialize pool immediately
                this.pools.set(key, new SoundPool(audio, 5));

                debugLogger.debug(`Sonido cargado: ${key}`, 'sound', { src, duration: audio.duration });
                resolve(audio);
            }, { once: true });

            audio.addEventListener('error', (e) => {
                debugLogger.warn(`No se pudo cargar sonido`, 'sound', {
                    key,
                    src,
                    error: e.message || 'Error desconocido',
                    errorCode: e.target?.error?.code
                });
                // Resolvemos igual para no bloquear el juego
                resolve(null);
            }, { once: true });

            // Iniciar carga
            audio.load();
        });
    }

    /**
     * Carga todos los sonidos del juego
     */
    async loadAll() {
        const soundsToLoad = [
            // Edificios
            { key: 'selectTownCenter', src: 'assets/sound/selectTownCenter.wav' },
            { key: 'selectHouse', src: 'assets/sound/selectHouse.wav' },
            { key: 'selectBarracks', src: 'assets/sound/selectBarracks.wav' },
            { key: 'selectStorage', src: 'assets/sound/selectStorage.wav' },
            { key: 'selectStorageWood', src: 'assets/sound/selectStorageWood.wav' },
            { key: 'selectMarket', src: 'assets/sound/selectMarket.wav' },
            { key: 'selectTemple', src: 'assets/sound/selectTemple.wav' },
            { key: 'selectWorkshop', src: 'assets/sound/selectWorkshop.wav' },

            // Unidades
            { key: 'selectVillager', src: 'assets/sound/selectVillager.wav' },
            { key: 'selectWarrior', src: 'assets/sound/selectWarrior.wav' },
            { key: 'selectArcher', src: 'assets/sound/selectArcher.wav' },

            // Creación y Construcción
            { key: 'createVillager', src: 'assets/sound/createVillager.wav' },
            { key: 'createWarrior', src: 'assets/sound/createWarrior.wav' },
            { key: 'createArcher', src: 'assets/sound/createArcher.wav' },
            { key: 'buildStart', src: 'assets/sound/buildStart.wav' },
            { key: 'buildWork', src: 'assets/sound/buildWork.wav' },
            { key: 'buildComplete', src: 'assets/sound/buildComplete.wav' },

            // Música / Ambiente
            { key: 'startGame', src: 'assets/sound/start-game.mp3' }
        ];

        debugLogger.start('Cargando sonidos del juego', 'sound');
        debugLogger.time('Carga de sonidos', 'sound');

        const promises = [];
        for (let i = 0; i < soundsToLoad.length; i++) {
            const sound = soundsToLoad[i];
            promises.push(this.loadSound(sound.key, sound.src));
        }
        await Promise.all(promises);

        const loadedCount = Object.keys(this.sounds).length;
        debugLogger.timeEnd('Carga de sonidos', 'sound');
        debugLogger.success(`${loadedCount}/${soundsToLoad.length} sonidos cargados`, 'sound', {
            cargados: Object.keys(this.sounds),
            total: soundsToLoad.length
        });
    }

    /**
     * Reproduce un sonido
     * @param {string} key - Identificador del sonido a reproducir
     * @param {number} [volume] - Volumen específico (opcional). Si no se especifica, usa el volumen global.
     */
    play(key, volume = null) {
        if (!this.enabled) return;

        // BOLT OPTIMIZATION: Use Pool
        let pool = this.pools.get(key);

        if (!pool) {
            // Lazy initialization if not loaded via loadSound (fallback)
            const sound = this.sounds[key];
            if (!sound) {
                // Fallback tone synthesis for error sound if it wasn't loaded from a file
                if (key === 'error') {
                    this.playTone(150, 0.2, 'sawtooth', 0.2);
                    return Promise.resolve();
                }

                // No logueamos advertencia aquí para evitar spam si faltan archivos de sonido opcionales
                return Promise.resolve();
            }
            pool = new SoundPool(sound, 5);
            this.pools.set(key, pool);
        }

        const finalVolume = volume !== null ? Math.max(0, Math.min(1, volume)) : this.volume;
        const promise = pool.play(finalVolume);

        promise.catch(err => {
            debugLogger.warn(`Error al reproducir sonido`, 'sound', {
                key,
                error: err.message,
                enabled: this.enabled,
                volume: finalVolume
            });
        });

        return promise;
    }

    /**
     * Reproduce el sonido de selección de una entidad basado en su tipo
     * @param {string} entityType - Tipo de entidad (townCenter, villager, warrior, etc.)
     */
    playEntitySelection(entityType) {
        if (!entityType) return;

        // Synthesize a generic selection sound for better feedback
        if (entityType === 'villager' || entityType === 'warrior' || entityType === 'archer') {
            this.playTone(350, 0.1, 'sine', 0.15);
        } else {
            this.playTone(200, 0.1, 'triangle', 0.15);
        }

        // Mapear el tipo de entidad al sonido correspondiente (ej: villager -> selectVillager)
        const soundKey = `select${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

        // Intentar reproducir el sonido específico
        if (this.sounds[soundKey]) {
            this.play(soundKey);
        } else {
            // Fallbacks opcionales si no existe el específico
            if (entityType === 'villager' || entityType === 'warrior' || entityType === 'archer') {
                if (this.sounds['selectUnit']) this.play('selectUnit');
            } else {
                if (this.sounds['selectBuilding']) this.play('selectBuilding');
            }
        }
    }

    /**
     * Inicia la música de fondo
     */
    startMusic() {
        if (!this.enabled || this.isPlayingMusic) return;
        this.isPlayingMusic = true;

        // Playlist logic
        const musicTracks = [
            'assets/sound/game0.mp3',
            'assets/sound/game1.mp3',
            'assets/sound/game2.mp3',
            'assets/sound/game3.mp3',
            'assets/sound/game4.mp3',
            'assets/sound/game5.mp3'
        ];

        let currentTrackIndex = Math.floor(Math.random() * musicTracks.length);

        const playNext = () => {
            if (!this.isPlayingMusic) return;

            const track = musicTracks[currentTrackIndex];
            
            // Clean up old instance if exists
            if (this.musicAudio) {
                this.musicAudio.pause();
                this.musicAudio = null;
            }

            this.musicAudio = new Audio(track);
            this.musicAudio.volume = this.volume * 0.5; // Música un poco más baja
            this.musicAudio.addEventListener('ended', () => {
                if (!this.isPlayingMusic) return;
                currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
                playNext();
            });

            this.musicAudio.play().catch(e => {
                this.isPlayingMusic = false;
                console.warn("Autoplay blocked or error playing music:", e);
            });
        };

        playNext();
    }

    /**
     * Detiene la música de fondo
     */
    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio = null;
        }
    }

    /**
     * Activa o desactiva los sonidos
     * @param {boolean} enabled - true para activar, false para desactivar
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Establece el volumen global
     * @param {number} volume - Volumen (0.0 a 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // BOLT OPTIMIZATION: Update all pools
        for (const pool of this.pools.values()) {
            pool.setVolume(this.volume);
        }

        // Actualizar volumen de todos los sonidos cargados (originales) por consistencia
        for (let key in this.sounds) {
            if (this.sounds[key]) {
                this.sounds[key].volume = this.volume;
            }
        }

        // Actualizar volumen de música si está sonando
        if (this.musicAudio) {
            this.musicAudio.volume = this.volume * 0.5;
        }
    }
}

export const soundManager = new SoundManager();
