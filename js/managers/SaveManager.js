/**
 * SaveManager - Sistema de guardado y carga del juego
 * Maneja persistencia del estado del juego en localStorage
 */
export class SaveManager {
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

            const state = JSON.parse(data);

            // Verificar versión
            if (state.version !== this.VERSION) {
                console.warn('Versión de guardado diferente, puede haber incompatibilidades');
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

            const state = JSON.parse(data);
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
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const state = JSON.parse(e.target.result);
                    resolve(state);
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
export const saveManager = new SaveManager();

// Compatibilidad con scripts tradicionales
if (typeof window !== 'undefined') {
    window.SaveManager = SaveManager;
    window.saveManager = saveManager;
}
