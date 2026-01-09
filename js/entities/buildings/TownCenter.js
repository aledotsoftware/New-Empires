import { Building } from '../Building.js';

/**
 * TownCenter - Centro Urbano
 * Edificio principal que entrena aldeanos y sirve como punto de recolección
 */
export class TownCenter extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/townCenter.png';
        this.name = 'Centro Urbano';
        this.type = 'townCenter';
        this.maxHp = 2000;
        this.hp = 2000;
        this.size = 60;
    }
}
