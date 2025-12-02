import { Unit } from '../Unit.js';

/**
 * Archer - Arquero
 * Unidad de combate a distancia
 */
export class Archer extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '🏹';
        this.name = 'Arquero';
        this.type = 'archer';
        this.maxHp = 60;
        this.hp = 60;
        this.attackDamage = 8;
        this.attackSpeed = 1.5;
        this.attackRange = 100;
        this.canAttack = true;
    }
}
