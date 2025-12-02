import { Building } from '../Building.js';

/**
 * Temple - Templo
 * Edificio religioso (funcionalidad futura)
 */
export class Temple extends Building {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⛪';
        this.name = 'Templo';
        this.type = 'temple';
        this.maxHp = 1500;
        this.hp = 1500;
        this.size = 55;
    }
}
