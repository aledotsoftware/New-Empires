import { Building } from '../Building.js';

/**
 * StorageWood - Depósito de Madera
 * Almacena madera específicamente
 */
export class StorageWood extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🌲';
        this.name = 'Depósito de Madera';
        this.type = 'storageWood';
        this.maxHp = 800;
        this.hp = 800;
        this.size = 40;
    }
}
