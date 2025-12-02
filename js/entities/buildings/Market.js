import { Building } from '../Building.js';

/**
 * Market - Mercado
 * Edificio económico para comercio (funcionalidad futura)
 */
export class Market extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏪';
        this.name = 'Mercado';
        this.type = 'market';
        this.maxHp = 1000;
        this.hp = 1000;
        this.size = 45;
    }
}
