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
        this.AVAILABLE_CIVS = ['mongols', 'mesopotamia', 'romans', 'vikings', 'argentinians'];
    }

    /**
     * Helper privado para realizar fetch de JSON con manejo de errores
     */
    async _fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`❌ Error cargando ${url}:`, error);
            throw error;
        }
    }

    /**
     * Carga todos los datos base del juego en paralelo
     */
    async loadBaseData() {
        console.log('🔄 Cargando datos base...');
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

            console.log('✅ Datos base cargados:', {
                technologies: this.baseData.technologies.length,
                buildings: this.baseData.buildings.length,
                units: this.baseData.units.length,
                ages: Object.keys(this.baseData.ages || {}).length
            });

            return true;
        } catch (error) {
            console.error('❌ Fallo crítico en carga de datos base');
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
            console.log(`✅ Civilización cargada: ${civData.name}`);
            return civData;
        } catch (error) {
            return null;
        }
    }

    /**
     * Carga todas las civilizaciones disponibles en paralelo
     */
    async loadAllCivilizations() {
        const promises = this.AVAILABLE_CIVS.map(civId => this.loadCivilization(civId));
        await Promise.all(promises);
        console.log(`✅ ${this.civilizations.size} civilizaciones cargadas`);
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
            console.error(`Unidad base ${uniqueUnitData.baseUnit} no encontrada`);
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
        console.log('🚀 Inicializando DataLoader...');
        const baseLoaded = await this.loadBaseData();
        if (!baseLoaded) throw new Error('No se pudieron cargar los datos base');

        await this.loadAllCivilizations();
        this.loaded = true;
        console.log('✅ DataLoader inicializado correctamente');
        return true;
    }
}

// Instancia global del loader
const dataLoader = new DataLoader();
