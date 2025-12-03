// ==========================================
// SOUND MANAGER - Sistema de gestión de sonidos
// ==========================================

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5; // Volumen por defecto (0.0 a 1.0)
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
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.debug(`Sonido cargado: ${key}`, 'sound', { src, duration: audio.duration });
                } else {
                    console.log(`🔊 Sonido cargado: ${key}`);
                }
                resolve(audio);
            }, { once: true });

            audio.addEventListener('error', (e) => {
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.warn(`No se pudo cargar sonido`, 'sound', {
                        key,
                        src,
                        error: e.message || 'Error desconocido',
                        errorCode: e.target?.error?.code
                    });
                } else {
                    console.warn(`⚠️ No se pudo cargar sonido: ${key} (${src})`, e);
                }
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

        if (typeof debugLogger !== 'undefined') {
            debugLogger.start('Cargando sonidos del juego', 'sound');
            debugLogger.time('Carga de sonidos', 'sound');
        } else {
            console.log('🔄 Iniciando carga de sonidos...');
        }

        const promises = soundsToLoad.map(sound => this.loadSound(sound.key, sound.src));
        await Promise.all(promises);

        const loadedCount = Object.keys(this.sounds).length;
        if (typeof debugLogger !== 'undefined') {
            debugLogger.timeEnd('Carga de sonidos', 'sound');
            debugLogger.success(`${loadedCount}/${soundsToLoad.length} sonidos cargados`, 'sound', {
                cargados: Object.keys(this.sounds),
                total: soundsToLoad.length
            });
        } else {
            console.log('✨ Todos los sonidos procesados.');
        }
    }

    /**
     * Reproduce un sonido
     * @param {string} key - Identificador del sonido a reproducir
     * @param {number} [volume] - Volumen específico (opcional). Si no se especifica, usa el volumen global.
     */
    play(key, volume = null) {
        if (!this.enabled) return;

        const sound = this.sounds[key];
        if (!sound) {
            // No logueamos advertencia aquí para evitar spam si faltan archivos de sonido opcionales
            return;
        }

        // Clonar el audio para permitir múltiples reproducciones simultáneas
        const clone = sound.cloneNode();
        clone.volume = volume !== null ? Math.max(0, Math.min(1, volume)) : this.volume;

        const promise = clone.play();

        promise.catch(err => {
            if (typeof debugLogger !== 'undefined') {
                debugLogger.warn(`Error al reproducir sonido`, 'sound', {
                    key,
                    error: err.message,
                    enabled: this.enabled,
                    volume: clone.volume
                });
            } else {
                console.warn(`⚠️ Error al reproducir sonido ${key}:`, err);
            }
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
        // Actualizar volumen de todos los sonidos cargados
        for (let key in this.sounds) {
            if (this.sounds[key]) {
                this.sounds[key].volume = this.volume;
            }
        }
    }
}

// Instancia global del SoundManager
const soundManager = new SoundManager();
