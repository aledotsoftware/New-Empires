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
                console.log(`🔊 Sonido cargado: ${key}`);
                resolve(audio);
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.warn(`⚠️ No se pudo cargar sonido: ${key} (${src})`, e);
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
            // Sonidos de selección de edificios
            { key: 'selectTownCenter', src: 'assets/sound/selectTownCenter.wav' }
            // Aquí se agregarán más sonidos en el futuro:
            // { key: 'selectHouse', src: 'assets/sound/selectHouse.wav' },
            // { key: 'selectBarracks', src: 'assets/sound/selectBarracks.wav' },
            // { key: 'buildingStart', src: 'assets/sound/buildingStart.wav' },
            // { key: 'buildingComplete', src: 'assets/sound/buildingComplete.wav' },
        ];

        console.log('🔄 Iniciando carga de sonidos...');
        const promises = soundsToLoad.map(sound => this.loadSound(sound.key, sound.src));
        await Promise.all(promises);
        console.log('✨ Todos los sonidos procesados.');
    }

    /**
     * Reproduce un sonido
     * @param {string} key - Identificador del sonido a reproducir
     */
    play(key) {
        if (!this.enabled) return;

        const sound = this.sounds[key];
        if (!sound) {
            console.warn(`⚠️ Sonido no encontrado: ${key}`);
            return;
        }

        // Clonar el audio para permitir múltiples reproducciones simultáneas
        const clone = sound.cloneNode();
        clone.volume = this.volume;
        clone.play().catch(err => {
            console.warn(`⚠️ Error al reproducir sonido ${key}:`, err);
        });
    }

    /**
     * Reproduce el sonido de selección de un edificio basado en su tipo
     * @param {string} buildingType - Tipo de edificio (townCenter, house, barracks, etc.)
     */
    playBuildingSelection(buildingType) {
        // Mapear el tipo de edificio al sonido correspondiente
        const soundKey = `select${buildingType.charAt(0).toUpperCase() + buildingType.slice(1)}`;

        // Si el sonido específico existe, reproducirlo
        if (this.sounds[soundKey]) {
            this.play(soundKey);
        } else {
            // Fallback: intentar con un sonido genérico si existe
            if (this.sounds['selectBuilding']) {
                this.play('selectBuilding');
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
