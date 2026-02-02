/**
 * SaveManager - Sistema de guardado y carga del juego
 * Maneja persistencia del estado del juego en localStorage
 */
class SaveManager {
    constructor() {
        this.SAVE_KEY = 'newempires_save';
        this.VERSION = '1.0';
    }

    /**
     * Guarda el estado actual del juego
     * @param {Game} game - Instancia del juego
     * @returns {boolean} true si se guardó correctamente
     */
    save(game) {
        try {
            const state = this._serializeGameState(game);
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));

            if (typeof debugLogger !== 'undefined') {
                debugLogger.success('Juego guardado', 'save', {
                    entities: state.units.length + state.buildings.length,
                    timestamp: new Date(state.timestamp).toLocaleTimeString()
                });
            }

            return true;
        } catch (error) {
            console.error('Error guardando juego:', error);
            return false;
        }
    }

    /**
     * Verifica si hay una partida guardada
     * @returns {boolean}
     */
    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    /**
     * Carga una partida guardada
     * @returns {Object|null} Estado del juego o null si no hay guardado
     */
    load() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            if (!data) {
                return null;
            }

            // Sentinel: Use safe reviver to prevent prototype pollution
            const state = JSON.parse(data, (k, v) => this._safeReviver(k, v));

            // Verificar versión
            if (state.version !== this.VERSION) {
                console.warn('Versión de guardado diferente, puede haber incompatibilidades');
            }

            // Sentinel: Validate state structure before returning
            if (!this._validateState(state)) {
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.error('Archivo de guardado corrupto o inválido', 'save');
                } else {
                    console.error('❌ Archivo de guardado corrupto o inválido');
                }
                return null;
            }

            if (typeof debugLogger !== 'undefined') {
                debugLogger.info('Partida cargada', 'save', {
                    civilizationId: state.civilizationId,
                    timestamp: new Date(state.timestamp).toLocaleString()
                });
            }

            return state;
        } catch (error) {
            console.error('Error cargando juego:', error);
            return null;
        }
    }

    /**
     * Elimina la partida guardada
     */
    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);

        if (typeof debugLogger !== 'undefined') {
            debugLogger.info('Partida guardada eliminada', 'save');
        }
    }

    /**
     * Obtiene información del guardado sin cargar todo
     * @returns {Object|null} Metadatos del guardado
     */
    getSaveInfo() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            if (!data) return null;

            // Sentinel: Safe parse
            const state = JSON.parse(data, (k, v) => this._safeReviver(k, v));

            // Basic validation for info retrieval
            if (!state || typeof state !== 'object') return null;

            return {
                version: state.version,
                timestamp: state.timestamp,
                civilizationId: state.civilizationId,
                gameTime: state.gameTime,
                population: state.units?.length || 0,
                buildings: state.buildings?.length || 0
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Sentinel: JSON Reviver para prevenir prototype pollution
     */
    _safeReviver(key, value) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return undefined;
        }
        return value;
    }

    /**
     * Valida la estructura del estado del juego
     * @param {Object} state - Estado deserializado
     * @returns {boolean} true si es válido
     */
    _validateState(state) {
        if (!state || typeof state !== 'object') return false;

        // Required top-level fields
        const requiredFields = [
            'version', 'timestamp', 'civilizationId', 'gameTime',
            'resources', 'units', 'buildings', 'enemies', 'resourceNodes'
        ];

        for (const field of requiredFields) {
            if (!(field in state)) {
                // console.warn(`Save validation failed: Missing field ${field}`);
                return false;
            }
        }

        // Validate types for critical fields
        if (typeof state.civilizationId !== 'string') return false;
        // Sentinel: Prevent path traversal/injection in civilizationId
        if (!/^[a-zA-Z0-9]+$/.test(state.civilizationId)) return false;

        if (typeof state.resources !== 'object') return false;
        if (!Array.isArray(state.units)) return false;
        if (!Array.isArray(state.buildings)) return false;
        if (!Array.isArray(state.enemies)) return false;
        if (!Array.isArray(state.resourceNodes)) return false;

        // Optional: Validate resource structure (prevent negative values or NaN)
        const resourceKeys = ['wood', 'food', 'gold', 'stone'];
        for (const key of resourceKeys) {
            if (typeof state.resources[key] !== 'number' || isNaN(state.resources[key])) {
                return false;
            }
        }

        // Sentinel: Prevent DoS by limiting array lengths
        const MAX_ENTITIES = 50000;
        if (state.units.length > MAX_ENTITIES || state.buildings.length > MAX_ENTITIES || state.enemies.length > MAX_ENTITIES) {
            // console.warn('Save validation failed: Too many entities');
            return false;
        }

        // Sentinel: Generic entity validator
        const validateEntities = (entities) => {
            for (let i = 0; i < entities.length; i++) {
                const e = entities[i];
                if (!e || typeof e !== 'object' ||
                    typeof e.type !== 'string' ||
                    typeof e.x !== 'number' ||
                    typeof e.y !== 'number') {
                    return false;
                }
            }
            return true;
        };

        if (!validateEntities(state.units)) return false;
        if (!validateEntities(state.buildings)) return false;
        if (!validateEntities(state.enemies)) return false;

        // Sentinel: Validate resource nodes structure
        if (!Array.isArray(state.resourceNodes)) return false;
        for (let i = 0; i < state.resourceNodes.length; i++) {
            const node = state.resourceNodes[i];
            if (!node || typeof node !== 'object' ||
                typeof node.type !== 'string' ||
                typeof node.amount !== 'number') {
                return false;
            }
        }

        return true;
    }

    /**
     * Serializa el estado completo del juego
     * @param {Game} game - Instancia del juego
     * @returns {Object} Estado serializado
     */
    _serializeGameState(game) {
        return {
            version: this.VERSION,
            timestamp: Date.now(),
            civilizationId: game.civilizationId,
            gameTime: Date.now() - game.gameStartTime,

            // Recursos
            resources: { ...game.resources },
            population: game.population,
            maxPopulation: game.maxPopulation,

            // Cámara
            camera: { x: game.camera.x, y: game.camera.y },

            // Mapa
            mapConfig: game.mapConfig,
            seed: game.mapConfig?.seed,

            // Entidades
            units: game.units.map(u => this._serializeEntity(u)),
            buildings: game.buildings.map(b => this._serializeEntity(b)),
            enemies: game.enemies.map(e => this._serializeEntity(e)),

            // Recursos del mapa
            resourceNodes: game.resourceNodes.map(r => ({
                x: r.x,
                y: r.y,
                type: r.type,
                amount: r.amount
            })),

            // Tecnologías
            researchedTechs: game.techManager?.researchedTechs || []
        };
    }

    /**
     * Serializa una entidad individual
     * @param {Entity} entity - Entidad a serializar
     * @returns {Object}
     */
    _serializeEntity(entity) {
        const base = {
            type: entity.type,
            x: entity.x,
            y: entity.y,
            hp: entity.hp,
            maxHp: entity.maxHp,
            team: entity.team
        };

        // Propiedades específicas de unidades
        if (entity.isUnit) {
            return {
                ...base,
                state: entity.state,
                speed: entity.speed,
                attackDamage: entity.attackDamage,
                carryAmount: entity.carryAmount || 0,
                carryType: entity.carryType || null
            };
        }

        // Propiedades específicas de edificios
        if (entity.isBuilding) {
            return {
                ...base,
                isUnderConstruction: entity.isUnderConstruction,
                constructionProgress: entity.isUnderConstruction ?
                    (entity.hp / entity.constructionMaxHp) : 1,
                widthTiles: entity.widthTiles,
                heightTiles: entity.heightTiles,
                gridCol: entity.gridCol,
                gridRow: entity.gridRow
            };
        }

        return base;
    }

    /**
     * Exporta el guardado como archivo JSON
     * @param {Game} game - Instancia del juego
     */
    exportToFile(game) {
        const state = this._serializeGameState(game);
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `newempires_save_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Importa un guardado desde archivo
     * @param {File} file - Archivo JSON
     * @returns {Promise<Object>} Estado del juego
     */
    async importFromFile(file) {
        // Sentinel: Prevent DoS by limiting file size
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
        if (file.size > MAX_SIZE) {
            return Promise.reject(new Error('El archivo es demasiado grande (Máximo 5MB)'));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Sentinel: Use safe reviver to prevent prototype pollution
                    const state = JSON.parse(e.target.result, (k, v) => this._safeReviver(k, v));
                    // Sentinel: Validate imported file structure
                    if (this._validateState(state)) {
                        resolve(state);
                    } else {
                        reject(new Error('Archivo de guardado inválido o corrupto'));
                    }
                } catch (error) {
                    reject(new Error('Archivo de guardado inválido'));
                }
            };
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }
}

// Instancia global
const saveManager = new SaveManager();

// Compatibilidad con scripts tradicionales
if (typeof window !== 'undefined') {
    window.SaveManager = SaveManager;
    window.saveManager = saveManager;
}
