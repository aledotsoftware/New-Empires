import { debugLogger } from "../utils/DebugLogger.js";
/**
 * AssetLoader - Gestor de carga de assets gráficos
 * Carga y gestiona las imágenes del juego de forma asíncrona
 */
export class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedCount = 0;
        this.totalAssets = 0;
        // Track ongoing loads to prevent redundant lazy loads
        this._loadingPromises = new Map();
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            // BOLT OPTIMIZATION: Lazy loading and async decoding
            img.loading = 'lazy';
            img.decoding = 'async';

            const handleLoad = () => {
                this.assets[key] = img;
                this.loadedCount++;
                debugLogger.debug(`Asset cargado: ${key}`, 'assets', {
                    width: img.width,
                    height: img.height,
                    progress: `${this.loadedCount}/${this.totalAssets}`
                });
                resolve(img);
            };

            const handleError = () => {
                debugLogger.warn(`No se pudo cargar asset`, 'assets', { key, src });
                // Resolvemos igual para no bloquear el juego, pero sin imagen
                resolve(null);
            };

            img.onload = handleLoad;
            img.onerror = handleError;

            img.src = src;

            if ('decode' in img) {
                // BOLT OPTIMIZATION: Decode off main thread
                img.decode().catch((e) => {
                    // Ignoramos el error aquí porque el onerror lo manejará si falla la carga.
                    // Si solo falla el decode pero carga bien, no queremos bloquear.
                    debugLogger.warn(`Aviso: img.decode() falló para ${key}`, 'assets', e);
                });
            }
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
            { key: 'wood', src: 'assets/icons/storageWood.png' },
            { key: 'food', src: 'assets/icons/house.png' }, // Fallback icon
            { key: 'gold', src: 'assets/icons/market.png' }, // Fallback icon
            { key: 'stone', src: 'assets/icons/storage.png' }, // Fallback icon
            // Technology icons
            { key: 'tech_economy', src: 'assets/icons/tech_economy.png' },
            { key: 'tech_military', src: 'assets/icons/tech_military.png' },
            { key: 'tech_defense', src: 'assets/icons/tech_defense.png' },
            { key: 'science', src: 'assets/icons/science.png' },
            { key: 'build', src: 'assets/icons/build.png' } // Assuming build.png exists or fallback to workshop
        ];

        this.totalAssets = assetsToLoad.length;

        debugLogger.start('Cargando assets gráficos', 'assets');
        debugLogger.time('Carga de assets', 'assets');

        const promises = [];
        for (let i = 0; i < assetsToLoad.length; i++) {
            const asset = assetsToLoad[i];
            promises.push(this.loadImage(asset.key, asset.src));
        }
        await Promise.all(promises);

        const loadedCount = Object.keys(this.assets).length;
        debugLogger.timeEnd('Carga de assets', 'assets');
        debugLogger.success(`${loadedCount}/${this.totalAssets} assets cargados`, 'assets', {
            cargados: Object.keys(this.assets)
        });
    }

    getImage(key) {
        // BOLT OPTIMIZATION: Lazy loading
        if (this.assets[key]) {
            return this.assets[key];
        }

        // If not loaded and not already loading, trigger async load
        if (!this._loadingPromises.has(key)) {
            const src = this.getSrc(key);
            if (src) {
                // Ensure we know it's loading
                const loadPromise = this.loadImage(key, src).then((img) => {
                    this._loadingPromises.delete(key);
                    return img;
                });
                this._loadingPromises.set(key, loadPromise);
            }
        }

        // Return null until loaded
        return null;
    }

    getSrc(key) {
        // If key starts with assets/ then it is already a path
        if (typeof key === 'string' && (key.startsWith('assets/') || key.startsWith('./assets/'))) {
            return key;
        }
        return AssetLoader.ASSET_MAP[key] || '';
    }

    /**
     * Obtiene la ruta de un icono para usar en el DOM
     * @param {string} key 
     * @returns {string}
     */
    getIconPath(key) {
        if (!key) return '';
        const src = this.getSrc(key);
        return src || `assets/icons/${key}.png`;
    }
}

// Static map to avoid allocation on every getSrc call
AssetLoader.ASSET_MAP = {
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
    'wood': 'assets/icons/storageWood.png',
    'food': 'assets/icons/house.png',
    'gold': 'assets/icons/market.png',
    'stone': 'assets/icons/storage.png',
    'tech_economy': 'assets/icons/tech_economy.png',
    'tech_military': 'assets/icons/tech_military.png',
    'tech_defense': 'assets/icons/tech_defense.png',
    'science': 'assets/icons/science.png',
    'build': 'assets/icons/build.png'
};

export const assetLoader = new AssetLoader();
