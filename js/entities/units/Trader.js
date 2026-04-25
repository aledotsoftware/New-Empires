import { Unit } from '../Unit.js';

/**
 * Trader - Comerciante
 * Genera oro mediante rutas comerciales
 */
export class Trader extends Unit {
    constructor(x, y, team) {
        super(x, y, team);
        this.icon = 'assets/icons/gold.png'; // Placeholder base_units
        this.name = 'Comerciante';
        this.type = 'trader';
        this.maxHp = 60;
        this.hp = 60;
        this.attackDamage = 0;
        this.attackSpeed = 0;
        this.attackRange = 0;
        this.speed = 60;
        this.canAttack = false;
        this.canTrade = true;
        this.tradeTarget = null;
        this.homeMarket = null;
        this.carryingGold = 0;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);

        // Lógica básica de comercio
        if (!this.canTrade || this.isDead) return;

        if (this.tradeTarget) {
            // Moverse hacia el mercado objetivo
            if (this.carryingGold === 0) {
                if (this.moveTowardsTarget(this.tradeTarget.x, this.tradeTarget.y, deltaTime, game, 40 * 40)) {
                    // Llegó al mercado enemigo, recoger oro
                    const dx = this.homeMarket ? (this.x - this.homeMarket.x) : 500;
                    const dy = this.homeMarket ? (this.y - this.homeMarket.y) : 500;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Oro ganado basado en la distancia
                    let goldAmount = Math.max(10, Math.floor(distance / 50));

                    if (game && game.modifiers && game.modifiers.tradeBonus) {
                        goldAmount = Math.floor(goldAmount * game.modifiers.tradeBonus);
                    }

                    this.carryingGold = goldAmount;
                }
            } else if (this.homeMarket) {
                // Volver al mercado propio
                if (this.moveTowardsTarget(this.homeMarket.x, this.homeMarket.y, deltaTime, game, 40 * 40)) {
                    // Entregar oro
                    if (game && game.resources) {
                        game.resources.gold += this.carryingGold;

                        if (game.particleSystem) {
                            game.particleSystem.createFloatingText(this.x, this.y - 20, `+${this.carryingGold} 💰`, '#ffc107');
                        }
                    }
                    this.carryingGold = 0;
                }
            } else {
                // Buscar mercado propio si no tiene
                if (game && game.buildings) {
                    for (let i = 0; i < game.buildings.length; i++) {
                        const b = game.buildings[i];
                        if (b.type === 'market' && b.team === this.team) {
                            this.homeMarket = b;
                            break;
                        }
                    }
                }
            }
        }
    }
}
