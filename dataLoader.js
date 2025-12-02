// ==========================================
// DATA LOADER - Sistema de Carga de JSON Optimizado
// ==========================================

class DataLoader {
    constructor() {
        this.baseData = {
            technologies: null,
            buildings: null,
            units: null,
            ages: null,
            categories: null
        };
        this.civilizations = new Map();
        this.loaded = false;

        // Configuración centralizada
        this.PATHS = {
            BASE_TECHS: 'assets/technologies/base_technologies.json',
            BASE_BUILDINGS: 'assets/technologies/base_buildings.json',
            BASE_UNITS: 'assets/technologies/base_units.json',
            CIVILIZATION: (id) => `assets/civilization/${id}.json`
        };

        // Lista de civilizaciones (Idealmente debería venir de un manifiesto externo)
        this.AVAILABLE_CIVS = ['mongols', 'sumeria', 'romans', 'vikings', 'argentinians'];
    }

    /**
     * Helper privado para realizar fetch de JSON con manejo de errores
     */
    async _fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (typeof debugLogger !== 'undefined') {
                debugLogger.debug(`Archivo cargado: ${url}`, 'data', { size: JSON.stringify(data).length });
            }
            return data;
        } catch (error) {
            if (typeof debugLogger !== 'undefined') {
                debugLogger.error(`Error cargando archivo JSON`, 'data', error, { url, timestamp: Date.now() });
            } else {
                console.error(`❌ Error cargando ${url}:`, error);
            }
            throw error;
        }
    }

    /**
     * Carga todos los datos base del juego en paralelo
     */
    async loadBaseData() {
        if (typeof debugLogger !== 'undefined') {
            debugLogger.start('Cargando datos base del juego', 'data');
            debugLogger.time('Carga de datos base', 'data');
        } else {
            console.log('🔄 Cargando datos base...');
        }

        try {
            const [techData, buildingsData, unitsData] = await Promise.all([
                this._fetchJson(this.PATHS.BASE_TECHS),
                this._fetchJson(this.PATHS.BASE_BUILDINGS),
                this._fetchJson(this.PATHS.BASE_UNITS)
            ]);

            this.baseData.technologies = techData.technologies;
            this.baseData.ages = techData.ages;
            this.baseData.categories = techData.categories;
            this.baseData.buildings = buildingsData.buildings;
            this.baseData.units = unitsData.units;

            const stats = {
                technologies: this.baseData.technologies?.length || 0,
                buildings: this.baseData.buildings?.length || 0,
                units: this.baseData.units?.length || 0,
                ages: Object.keys(this.baseData.ages || {}).length
            };

            if (typeof debugLogger !== 'undefined') {
                debugLogger.timeEnd('Carga de datos base', 'data');
                debugLogger.success('Datos base cargados correctamente', 'data', stats);
            } else {
                console.log('✅ Datos base cargados:', stats);
            }

            return true;
        } catch (error) {
            if (typeof debugLogger !== 'undefined') {
                debugLogger.error('Fallo crítico en carga de datos base', 'data', error, {
                    paths: this.PATHS,
                    timestamp: Date.now()
                });
            } else {
                console.error('❌ Fallo crítico en carga de datos base', error);
            }
            return false;
        }
    }

    /**
     * Carga una civilización específica
     */
    async loadCivilization(civilizationId) {
        try {
            const civData = await this._fetchJson(this.PATHS.CIVILIZATION(civilizationId));
            this.civilizations.set(civilizationId, civData);

            if (typeof debugLogger !== 'undefined') {
                debugLogger.success(`Civilización cargada: ${civData.name}`, 'data', { id: civilizationId });
            } else {
                console.log(`✅ Civilización cargada: ${civData.name}`);
            }
            return civData;
        } catch (error) {
            if (typeof debugLogger !== 'undefined') {
                debugLogger.warn(`No se pudo cargar civilización: ${civilizationId}`, 'data', { error: error.message });
            }
            return null;
        }
    }

    /**
     * Carga todas las civilizaciones disponibles en paralelo
     */
    async loadAllCivilizations() {
        if (typeof debugLogger !== 'undefined') {
            debugLogger.time('Carga de civilizaciones', 'data');
        }

        const promises = this.AVAILABLE_CIVS.map(civId => this.loadCivilization(civId));
        await Promise.all(promises);

        if (typeof debugLogger !== 'undefined') {
            debugLogger.timeEnd('Carga de civilizaciones', 'data');
            debugLogger.success(`${this.civilizations.size} civilizaciones cargadas`, 'data', {
                civilizaciones: Array.from(this.civilizations.keys())
            });
        } else {
            console.log(`✅ ${this.civilizations.size} civilizaciones cargadas`);
        }
    }

    /**
     * Método genérico optimizado para aplicar overrides
     * Elimina la duplicación de código en getTechnologies, getBuildings, etc.
     */
    _applyOverrides(baseList, overrides = {}, uniqueItems = []) {
        if (!baseList) return [];

        // Usamos structuredClone para una copia profunda nativa y eficiente
        // Mapeamos directamente para transformar los datos
        const processedList = baseList.map(item => {
            const override = overrides[item.id];

            // Creamos el nuevo objeto item base
            const newItem = structuredClone(item);

            // Aplicamos transformación de propiedades base -> activas
            // Si hay override, usa eso, si no, usa baseName/baseIcon, si no, mantiene el original
            newItem.name = override?.name || item.baseName || item.name;
            newItem.icon = override?.icon || item.baseIcon || item.icon;
            newItem.description = override?.description || item.baseDescription || item.description;

            // Si hay otras propiedades en el override, las mezclamos
            if (override) {
                Object.assign(newItem, override);
            }

            return newItem;
        });

        // Añadir items únicos si existen
        if (uniqueItems && uniqueItems.length > 0) {
            processedList.push(...structuredClone(uniqueItems));
        }

        return processedList;
    }

    getTechnologiesForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) return this.baseData.technologies;

        return this._applyOverrides(
            this.baseData.technologies,
            civData.technologyOverrides,
            civData.uniqueTechnologies
        );
    }

    getBuildingsForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) return this.baseData.buildings;

        return this._applyOverrides(
            this.baseData.buildings,
            civData.buildingOverrides
        );
    }

    getUnitsForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) return this.baseData.units;

        const units = this._applyOverrides(
            this.baseData.units,
            civData.unitOverrides
        );

        // Manejo especial para unidad única que requiere lógica extra
        if (civData.uniqueUnit) {
            const uniqueUnit = this.createUniqueUnit(civData.uniqueUnit);
            if (uniqueUnit) units.push(uniqueUnit);
        }

        return units;
    }

    createUniqueUnit(uniqueUnitData) {
        const baseUnit = this.baseData.units.find(u => u.id === uniqueUnitData.baseUnit);
        if (!baseUnit) {
            if (typeof debugLogger !== 'undefined') {
                debugLogger.error('Unidad base no encontrada para unidad única', 'data', null, {
                    baseUnit: uniqueUnitData.baseUnit,
                    uniqueUnitId: uniqueUnitData.id,
                    availableUnits: this.baseData.units.map(u => u.id)
                });
            } else {
                console.error(`Unidad base ${uniqueUnitData.baseUnit} no encontrada`);
            }
            return null;
        }

        const uniqueUnit = structuredClone(baseUnit);

        // Aplicar propiedades únicas de forma más limpia
        Object.assign(uniqueUnit, {
            id: uniqueUnitData.id,
            name: uniqueUnitData.name,
            icon: uniqueUnitData.icon,
            availableFromAge: uniqueUnitData.age,
            isUnique: true
        });

        // Aplicar bonificaciones matemáticamente
        if (uniqueUnitData.bonuses) {
            for (const [stat, multiplier] of Object.entries(uniqueUnitData.bonuses)) {
                if (typeof uniqueUnit[stat] === 'number') {
                    uniqueUnit[stat] = Math.floor(uniqueUnit[stat] * multiplier);
                }
            }
        }

        return uniqueUnit;
    }

    // Getters simples
    getAgeInfo(ageNumber) { return this.baseData.ages?.[ageNumber] || null; }
    getAllAges() { return this.baseData.ages; }
    getCategories() { return this.baseData.categories; }
    getCivilizationData(civilizationId) { return this.civilizations.get(civilizationId); }
    getAllCivilizations() { return Array.from(this.civilizations.values()); }
    isLoaded() { return this.loaded; }

    async initialize() {
        if (typeof debugLogger !== 'undefined') {
            debugLogger.start('Inicializando DataLoader', 'data');
            debugLogger.time('Inicialización completa de DataLoader', 'data');
        } else {
            console.log('🚀 Inicializando DataLoader...');
        }

        const baseLoaded = await this.loadBaseData();
        if (!baseLoaded) {
            const error = new Error('No se pudieron cargar los datos base');
            if (typeof debugLogger !== 'undefined') {
                debugLogger.error('Fallo en inicialización de DataLoader', 'data', error);
            }
            throw error;
        }

        await this.loadAllCivilizations();
        this.loaded = true;

        if (typeof debugLogger !== 'undefined') {
            debugLogger.timeEnd('Inicialización completa de DataLoader', 'data');
            debugLogger.success('DataLoader inicializado correctamente', 'data', {
                civilizaciones: this.civilizations.size,
                tecnologías: this.baseData.technologies?.length || 0
            });
        } else {
            console.log('✅ DataLoader inicializado correctamente');
        }
        return true;
    }
}

// Instancia global del loader
const dataLoader = new DataLoader();
