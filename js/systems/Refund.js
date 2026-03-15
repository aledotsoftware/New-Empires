export class RefundManager {
    static refundCost(game, cost) {
        if (!cost || !game || !game.resources) return;

        for (const [res, amount] of Object.entries(cost)) {
            game.resources[res] = (game.resources[res] || 0) + amount;
            if (typeof game.flashResource === 'function') {
                game.flashResource(res);
            }
        }
    }
}
