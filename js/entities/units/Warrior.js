import { Unit } from '../Unit.js';

/**
 * Warrior - Guerrero
 * Unidad de combate cuerpo a cuerpo
 */
export class Warrior extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = '⚔️';
        this.name = 'Guerrero';
        this.type = 'warrior';
        this.maxHp = 100;
        this.hp = 100;
        this.attackDamage = 10;
        this.attackSpeed = 1.2;
        this.canAttack = true;
    }
}
