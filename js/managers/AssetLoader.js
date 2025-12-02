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
            { key: 'workshop', src: 'assets/icons/workshop.png' }
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
}

// Instancia global del loader
export const assetLoader = new AssetLoader();
