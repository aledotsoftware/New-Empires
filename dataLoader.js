// ==========================================
// DATA LOADER - Sistema de Carga de JSON
// ==========================================

class DataLoader {
    constructor() {
        this.baseTechnologies = null;
        this.baseBuildings = null;
        this.baseUnits = null;
        this.civilizations = new Map();
        this.ages = null;
        this.categories = null;
        this.loaded = false;
    }

    /**
     * Carga todos los datos base del juego
     */
    async loadBaseData() {
        try {
            console.log('🔄 Cargando datos base...');

            // Cargar tecnologías base
            const techResponse = await fetch('assets/technologies/base_technologies.json');
            const techData = await techResponse.json();
            this.baseTechnologies = techData.technologies;
            this.ages = techData.ages;
            this.categories = techData.categories;

            // Cargar edificios base
            const buildingsResponse = await fetch('assets/technologies/base_buildings.json');
            const buildingsData = await buildingsResponse.json();
            this.baseBuildings = buildingsData.buildings;

            // Cargar unidades base
            const unitsResponse = await fetch('assets/technologies/base_units.json');
            const unitsData = await unitsResponse.json();
            this.baseUnits = unitsData.units;

            console.log('✅ Datos base cargados:', {
                technologies: this.baseTechnologies.length,
                buildings: this.baseBuildings.length,
                units: this.baseUnits.length,
                ages: Object.keys(this.ages).length
            });

            return true;
        } catch (error) {
            console.error('❌ Error cargando datos base:', error);
            return false;
        }
    }

    /**
     * Carga una civilización específica
     */
    async loadCivilization(civilizationId) {
        try {
            const response = await fetch(`assets/civilization/${civilizationId}.json`);
            const civData = await response.json();
            this.civilizations.set(civilizationId, civData);
            console.log(`✅ Civilización cargada: ${civData.name}`);
            return civData;
        } catch (error) {
            console.error(`❌ Error cargando civilización ${civilizationId}:`, error);
            return null;
        }
    }

    /**
     * Carga todas las civilizaciones disponibles
     */
    async loadAllCivilizations() {
        // Lista de civilizaciones disponibles (esto podría venir de un index.json)
        const availableCivs = ['mongols', 'mesopotamia'];

        const promises = availableCivs.map(civId => this.loadCivilization(civId));
        await Promise.all(promises);

        console.log(`✅ ${this.civilizations.size} civilizaciones cargadas`);
    }

    /**
     * Obtiene las tecnologías para una civilización específica
     * Aplica sobrescrituras y añade tecnologías únicas
     */
    getTechnologiesForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) {
            console.warn(`Civilización ${civilizationId} no encontrada, usando datos base`);
            return this.baseTechnologies;
        }

        // Clonar tecnologías base
        let technologies = JSON.parse(JSON.stringify(this.baseTechnologies));

        // Aplicar sobrescrituras
        if (civData.technologyOverrides) {
            technologies = technologies.map(tech => {
                const override = civData.technologyOverrides[tech.id];
                if (override) {
                    return {
                        ...tech,
                        name: override.name || tech.baseName,
                        icon: override.icon || tech.baseIcon,
                        description: override.description || tech.baseDescription
                    };
                }
                return {
                    ...tech,
                    name: tech.baseName,
                    icon: tech.baseIcon,
                    description: tech.baseDescription
                };
            });
        }

        // Añadir tecnologías únicas
        if (civData.uniqueTechnologies) {
            technologies.push(...civData.uniqueTechnologies);
        }

        return technologies;
    }

    /**
     * Obtiene los edificios para una civilización específica
     */
    getBuildingsForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) {
            return this.baseBuildings;
        }

        let buildings = JSON.parse(JSON.stringify(this.baseBuildings));

        // Aplicar sobrescrituras
        if (civData.buildingOverrides) {
            buildings = buildings.map(building => {
                const override = civData.buildingOverrides[building.id];
                if (override) {
                    return {
                        ...building,
                        name: override.name || building.baseName,
                        icon: override.icon || building.baseIcon,
                        description: override.description || building.baseDescription
                    };
                }
                return {
                    ...building,
                    name: building.baseName,
                    icon: building.baseIcon,
                    description: building.baseDescription
                };
            });
        }

        return buildings;
    }

    /**
     * Obtiene las unidades para una civilización específica
     */
    getUnitsForCivilization(civilizationId) {
        const civData = this.civilizations.get(civilizationId);
        if (!civData) {
            return this.baseUnits;
        }

        let units = JSON.parse(JSON.stringify(this.baseUnits));

        // Aplicar sobrescrituras
        if (civData.unitOverrides) {
            units = units.map(unit => {
                const override = civData.unitOverrides[unit.id];
                if (override) {
                    return {
                        ...unit,
                        name: override.name || unit.baseName,
                        icon: override.icon || unit.baseIcon,
                        description: override.description || unit.baseDescription
                    };
                }
                return {
                    ...unit,
                    name: unit.baseName,
                    icon: unit.baseIcon,
                    description: unit.baseDescription
                };
            });
        }

        // Añadir unidad única si existe
        if (civData.uniqueUnit) {
            units.push(this.createUniqueUnit(civData.uniqueUnit));
        }

        return units;
    }

    /**
     * Crea una unidad única basada en una unidad base
     */
    createUniqueUnit(uniqueUnitData) {
        const baseUnit = this.baseUnits.find(u => u.id === uniqueUnitData.baseUnit);
        if (!baseUnit) {
            console.error(`Unidad base ${uniqueUnitData.baseUnit} no encontrada`);
            return null;
        }

        // Clonar unidad base
        const uniqueUnit = JSON.parse(JSON.stringify(baseUnit));

        // Aplicar propiedades únicas
        uniqueUnit.id = uniqueUnitData.id;
        uniqueUnit.name = uniqueUnitData.name;
        uniqueUnit.icon = uniqueUnitData.icon;
        uniqueUnit.availableFromAge = uniqueUnitData.age;
        uniqueUnit.isUnique = true;

        // Aplicar bonificaciones
        if (uniqueUnitData.bonuses) {
            for (const [stat, multiplier] of Object.entries(uniqueUnitData.bonuses)) {
                if (typeof uniqueUnit[stat] === 'number') {
                    uniqueUnit[stat] = Math.floor(uniqueUnit[stat] * multiplier);
                }
            }
        }

        return uniqueUnit;
    }

    /**
     * Obtiene información de una edad específica
     */
    getAgeInfo(ageNumber) {
        return this.ages ? this.ages[ageNumber] : null;
    }

    /**
     * Obtiene todas las edades
     */
    getAllAges() {
        return this.ages;
    }

    /**
     * Obtiene información de categorías
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Obtiene datos de una civilización
     */
    getCivilizationData(civilizationId) {
        return this.civilizations.get(civilizationId);
    }

    /**
     * Obtiene lista de todas las civilizaciones cargadas
     */
    getAllCivilizations() {
        return Array.from(this.civilizations.values());
    }

    /**
     * Inicializa el loader cargando todos los datos necesarios
     */
    async initialize() {
        console.log('🚀 Inicializando DataLoader...');

        const baseLoaded = await this.loadBaseData();
        if (!baseLoaded) {
            throw new Error('No se pudieron cargar los datos base');
        }

        await this.loadAllCivilizations();

        this.loaded = true;
        console.log('✅ DataLoader inicializado correctamente');
        return true;
    }

    /**
     * Verifica si los datos están cargados
     */
    isLoaded() {
        return this.loaded;
    }
}

// Instancia global del loader
const dataLoader = new DataLoader();
