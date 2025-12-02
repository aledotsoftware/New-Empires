import { Building } from '../Building.js';

/**
 * Workshop - Taller
 * Edificio de producción (funcionalidad futura)
 */
export class Workshop extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🔨';
        this.name = 'Taller';
        this.type = 'workshop';
        this.maxHp = 1100;
        this.hp = 1100;
        this.size = 50;
    }
}
