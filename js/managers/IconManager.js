/**
 * RESOURCE ICONS CONFIGURATION
 * Sistema centralizado de iconos para recursos y edificios
 */

export const RESOURCE_ICONS = {
    // Recursos
    wood: 'assets/icons/Aoe2de_wood.webp',
    food: 'assets/icons/villager.png',  // Temporal, buscar icono de comida
    gold: 'assets/icons/Mining_camp_aoe2de.webp',  // Temporal
    stone: 'assets/icons/Mining_camp_aoe2de.webp',  // Usar mismo hasta tener icono específico

    // Edificios
    house: 'assets/icons/house.png',
    barracks: 'assets/icons/barracks.png',
    townCenter: 'assets/icons/townCenter.png',
    storage: 'assets/icons/storage.png',
    storageWood: 'assets/icons/storageWood.png',
    market: 'assets/icons/market.png',
    temple: 'assets/icons/temple.png',
    workshop: 'assets/icons/workshop.png',

    // Unidades
    villager: 'assets/icons/villager.png',
    warrior: 'assets/icons/warrior.png',
    archer: 'assets/icons/archer.png',

    // Edades
    bronzeAge: 'assets/icons/EdadDeBronce_DE.webp',
    ironAge: 'assets/icons/EdadDeHierro_DE.webp',
    toolAge: 'assets/icons/EdadDeLasHerramientas_DE.webp'
};

// Emojis como fallback (si no se carga la imagen)
export const EMOJI_FALLBACKS = {
    wood: '🌲',
    food: '🌾',
    gold: '💎',
    stone: '🪨',
    house: '🛖',
    barracks: '🎪',
    townCenter: '🏛️',
    storage: '📦',
    storageWood: '🌲',
    market: '🏪',
    temple: '⛪',
    workshop: '🔨',
    villager: '👷',
    warrior: '🗡️',
    archer: '🏹',
    skull: '💀',
    tech_economy: '⚙️',
    tech_military: '⚔️',
    tech_defense: '🛡️',
    science: '🔬',
    population: '👥'
};

/**
 * Clase helper para cargar y renderizar iconos
 */
export class IconManager {
    constructor() {
        this.loadedIcons = new Map();
        this.loading = new Set();
    }

    /**
     * Precarga todos los iconos de recursos
     */
    preloadResourceIcons() {
        const promises = [];

        for (const [key, path] of Object.entries(RESOURCE_ICONS)) {
            promises.push(this.loadIcon(key, path));
        }

        return Promise.all(promises);
    }

    /**
     * Carga un icono específico
     */
    loadIcon(key, path) {
        return new Promise((resolve, reject) => {
            if (this.loadedIcons.has(key)) {
                resolve(this.loadedIcons.get(key));
                return;
            }

            if (this.loading.has(key)) {
                // Ya se está cargando, esperar
                const checkInterval = setInterval(() => {
                    if (this.loadedIcons.has(key)) {
                        clearInterval(checkInterval);
                        resolve(this.loadedIcons.get(key));
                    }
                }, 50);
                return;
            }

            this.loading.add(key);
            const img = new Image();

            img.onload = () => {
                this.loadedIcons.set(key, img);
                this.loading.delete(key);
                console.log(`✅ Icono cargado: ${key}`);
                resolve(img);
            };

            img.onerror = () => {
                this.loading.delete(key);
                console.warn(`⚠️ No se pudo cargar icono: ${key} (${path})`);
                reject(new Error(`Failed to load icon: ${key}`));
            };

            img.src = path;
        });
    }

    /**
     * Obtiene un icono cargado
     */
    getIcon(key) {
        return this.loadedIcons.get(key) || null;
    }

    /**
     * Dibuja un icono en el canvas
     */
    drawIcon(ctx, key, x, y, size = 32) {
        const icon = this.getIcon(key);

        if (icon && icon.complete) {
            ctx.drawImage(icon, x, y, size, size);
            return true;
        } else {
            // Fallback a emoji
            const emoji = EMOJI_FALLBACKS[key] || '❓';
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + size / 2, y + size / 2);
            return false;
        }
    }

    /**
     * Obtiene el emoji fallback
     */
    getFallback(key) {
        return EMOJI_FALLBACKS[key] || '❓';
    }
}

export const iconManager = new IconManager();
