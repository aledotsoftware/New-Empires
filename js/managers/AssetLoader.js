/**
 * AssetLoader - Gestor de carga de assets gráficos
 * Carga y gestiona las imágenes del juego de forma asíncrona
 */
export class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedCount = 0;
        this.totalAssets = 0;
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.assets[key] = img;
                this.loadedCount++;
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.debug(`Asset cargado: ${key}`, 'assets', {
                        width: img.width,
                        height: img.height,
                        progress: `${this.loadedCount}/${this.totalAssets}`
                    });
                } else {
                    console.log(`✅ Asset cargado: ${key}`);
                }
                resolve(img);
            };
            img.onerror = () => {
                if (typeof debugLogger !== 'undefined') {
                    debugLogger.warn(`No se pudo cargar asset`, 'assets', { key, src });
                } else {
                    console.warn(`⚠️ No se pudo cargar asset: ${key} (${src})`);
                }
                // Resolvemos igual para no bloquear el juego, pero sin imagen
                resolve(null);
            };
        });
    }

    async loadAll() {
        const assetsToLoad = [
            { key: 'villager', src: 'assets/icons/villager.png' },
            { key: 'warrior', src: 'assets/icons/warrior.png' },
            { key: 'archer', src: 'assets/icons/archer.png' },
            { key: 'townCenter', src: 'assets/icons/townCenter.png' },
            { key: 'house', src: 'assets/icons/house.png' },
            { key: 'barracks', src: 'assets/icons/barracks.png' },
            { key: 'storage', src: 'assets/icons/storage.png' },
            { key: 'storageWood', src: 'assets/icons/storageWood.png' },
            { key: 'market', src: 'assets/icons/market.png' },
            { key: 'temple', src: 'assets/icons/temple.png' },
            { key: 'workshop', src: 'assets/icons/workshop.png' },
            // Resource icons
            { key: 'wood', src: 'assets/icons/wood.png' },
            { key: 'food', src: 'assets/icons/food.png' },
            { key: 'gold', src: 'assets/icons/gold.png' },
            { key: 'stone', src: 'assets/icons/stone.png' },
            { key: 'population', src: 'assets/icons/population.png' },
            // UI Icons
            { key: 'time', src: 'assets/icons/time.png' },
            { key: 'settings', src: 'assets/icons/settings.png' },
            { key: 'techtree', src: 'assets/icons/techtree.png' },
            { key: 'map', src: 'assets/icons/map.png' },
            { key: 'start', src: 'assets/icons/start.png' },
            { key: 'close', src: 'assets/icons/close.png' },
            { key: 'check', src: 'assets/icons/check.png' },
            { key: 'info', src: 'assets/icons/info.png' },
            { key: 'error', src: 'assets/icons/error.png' },
            { key: 'build', src: 'assets/icons/build.png' },
            { key: 'tech_economy', src: 'assets/icons/tech_economy.png' },
            { key: 'tech_military', src: 'assets/icons/tech_military.png' },
            { key: 'tech_defense', src: 'assets/icons/tech_defense.png' },
            { key: 'science', src: 'assets/icons/science.png' }
        ];

        this.totalAssets = assetsToLoad.length;

        if (typeof debugLogger !== 'undefined') {
            debugLogger.start('Cargando assets gráficos', 'assets');
            debugLogger.time('Carga de assets', 'assets');
        } else {
            console.log('🔄 Iniciando carga de assets...');
        }

        const promises = assetsToLoad.map(asset => this.loadImage(asset.key, asset.src));
        await Promise.all(promises);

        const loadedCount = Object.keys(this.assets).length;
        if (typeof debugLogger !== 'undefined') {
            debugLogger.timeEnd('Carga de assets', 'assets');
            debugLogger.success(`${loadedCount}/${this.totalAssets} assets cargados`, 'assets', {
                cargados: Object.keys(this.assets)
            });
        } else {
            console.log('✨ Todos los assets procesados.');
        }
    }

    getImage(key) {
        return this.assets[key];
    }

    getSrc(key) {
        const map = {
            'villager': 'assets/icons/villager.png',
            'warrior': 'assets/icons/warrior.png',
            'archer': 'assets/icons/archer.png',
            'townCenter': 'assets/icons/townCenter.png',
            'house': 'assets/icons/house.png',
            'barracks': 'assets/icons/barracks.png',
            'storage': 'assets/icons/storage.png',
            'storageWood': 'assets/icons/storageWood.png',
            'market': 'assets/icons/market.png',
            'temple': 'assets/icons/temple.png',
            'workshop': 'assets/icons/workshop.png',
            'wood': 'assets/icons/wood.png',
            'food': 'assets/icons/food.png',
            'gold': 'assets/icons/gold.png',
            'stone': 'assets/icons/stone.png',
            'population': 'assets/icons/population.png',
            'time': 'assets/icons/time.png',
            'settings': 'assets/icons/settings.png',
            'techtree': 'assets/icons/techtree.png',
            'map': 'assets/icons/map.png',
            'start': 'assets/icons/start.png',
            'close': 'assets/icons/close.png',
            'check': 'assets/icons/check.png',
            'info': 'assets/icons/info.png',
            'error': 'assets/icons/error.png',
            'build': 'assets/icons/build.png',
            'tech_economy': 'assets/icons/tech_economy.png',
            'tech_military': 'assets/icons/tech_military.png',
            'tech_defense': 'assets/icons/tech_defense.png',
            'science': 'assets/icons/science.png'
        };
        return map[key] || '';
    }
}

// Instancia global del loader
export const assetLoader = new AssetLoader();
