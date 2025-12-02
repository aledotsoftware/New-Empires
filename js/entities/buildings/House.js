import { Building } from '../Building.js';

/**
 * House - Casa
 * Aumenta el límite de población
 */
export class House extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏠';
        this.name = 'Casa';
        this.type = 'house';
        this.maxHp = 500;
        this.hp = 500;
        this.size = 30;
    }
}
