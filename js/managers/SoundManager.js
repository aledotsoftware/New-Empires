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

        if (biomeName === 'Bosque') {
            // Sintetizar cantos de pájaros (suavizado para no ser irritante)
            const oscillator = this.audioContext.createOscillator();
            oscillator.connect(gainNode);
            oscillator.type = 'sine';

            // Variación de tono para imitar un pájaro (Frecuencias más bajas para evitar pitidos agudos)
            oscillator.frequency.setValueAtTime(2000, now);
            oscillator.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.2);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.02, now + 0.05); // Volumen más bajo
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);

            oscillator.start(now);
            oscillator.stop(now + 0.2);

        } else if (biomeName === 'Desierto') {
            // Sintetizar viento (ruido blanco + filtro paso bajo)
            const bufferSize = this.audioContext.sampleRate * 3; // 3 segundos para fade out más suave
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            // Variar la frecuencia del filtro para simular ráfagas de viento
            filter.frequency.setValueAtTime(80, now);
            filter.frequency.linearRampToValueAtTime(300, now + 1.5);
            filter.frequency.linearRampToValueAtTime(80, now + 3);

            noiseSource.connect(filter);
            filter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.015, now + 1); // Volumen sutil
            gainNode.gain.linearRampToValueAtTime(0.01, now + 3);

            noiseSource.start(now);
        } else if (biomeName === 'Agua') {
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
        } else if (biomeName === 'Pastizal') {
            // Viento muy suave y sutil
            const oscillator = this.audioContext.createOscillator();
            oscillator.connect(gainNode);
            oscillator.type = 'sine';

            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.linearRampToValueAtTime(150, now + 1);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.01, now + 0.5);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 1);

            oscillator.start(now);
            oscillator.stop(now + 1);
        } else if (biomeName === 'Montañas' || biomeName === 'Colinas') {
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
        } else if (biomeName === 'Nieve') {
            // Viento helado
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.linearRampToValueAtTime(200, now + 2);

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 800;

            oscillator.connect(filter);
            filter.connect(gainNode);

            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.01, now + 1);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2);

            oscillator.start(now);
            oscillator.stop(now + 2);
        }
    }

    // --- Sonidos Sintetizados (Acciones Rápidas) ---
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

    playGather() {
        if (!this.enabled) return;
        this.playTone(600, 0.05, 'sine', 0.08);
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
        if (!this.enabled) return;

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
            const track = musicTracks[currentTrackIndex];
            this.musicAudio = new Audio(track);
            this.musicAudio.volume = this.volume * 0.5; // Música un poco más baja
            this.musicAudio.addEventListener('ended', () => {
                currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
                playNext();
            });
            this.musicAudio.play().catch(e => {
                console.warn("Autoplay blocked or error playing music:", e);
                // Try again on interaction if needed, but for now we log
            });
        };

        playNext();
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
