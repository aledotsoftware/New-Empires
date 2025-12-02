import { Building } from '../Building.js';

/**
 * Barracks - Cuartel
 * Entrena unidades militares (guerreros, arqueros)
 */
export class Barracks extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⚔️';
        this.name = 'Cuartel';
        this.type = 'barracks';
        this.maxHp = 1200;
        this.hp = 1200;
        this.size = 50;
    }
}
