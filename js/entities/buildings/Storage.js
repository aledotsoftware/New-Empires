import { Building } from '../Building.js';

/**
 * Storage - Depósito
 * Almacena recursos y sirve como punto de entrega
 */
export class Storage extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/storage.png';
        this.name = 'Depósito';
        this.type = 'storage';
        this.maxHp = 800;
        this.hp = 800;
        this.size = 40;
    }
}
