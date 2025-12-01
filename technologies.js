const TECHNOLOGIES = {
    loom: {
        id: 'loom',
        name: 'Telar',
        icon: '🧶',
        description: 'Aldeanos +15 HP. Los hace más resistentes.',
        cost: { gold: 50 },
        researchTime: 5,
        building: 'townCenter',
        apply: (game) => {
            // Mejorar unidades existentes
            game.units.forEach(u => {
                if (u.type === 'villager') {
                    u.maxHp += 15;
                    u.hp += 15;
                }
            });
            // Nota: Las nuevas unidades deberán chequear esta tecnología al crearse
        }
    },
    doubleBitAxe: {
        id: 'doubleBitAxe',
        name: 'Hacha Doble',
        icon: '🪓',
        description: 'Madera se recolecta 20% más rápido.',
        cost: { food: 100, wood: 50 },
        researchTime: 10,
        building: 'storage',
        apply: (game) => {
            CONFIG.GATHER_RATES.wood *= 1.2;
        }
    },
    forging: {
        id: 'forging',
        name: 'Forja',
        icon: '🔥',
        description: 'Guerreros +2 Ataque.',
        cost: { food: 150 },
        researchTime: 10,
        building: 'barracks',
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'warrior') {
                    u.attackDamage += 2;
                }
            });
        }
    },
    fletching: {
        id: 'fletching',
        name: 'Flechas Pluma',
        icon: '🏹',
        description: 'Arqueros +20 Rango y +1 Ataque.',
        cost: { food: 100, gold: 50 },
        researchTime: 10,
        building: 'barracks',
        apply: (game) => {
            game.units.forEach(u => {
                if (u.type === 'archer') {
                    u.attackRange += 20;
                    u.attackDamage += 1;
                }
            });
        }
    }
};

class TechManager {
    constructor(game) {
        this.game = game;
        this.researchedTechs = new Set();
        this.researchQueue = []; // { techId, timer }
    }

    canResearch(techId) {
        const tech = TECHNOLOGIES[techId];
        if (!tech) return false;
        if (this.researchedTechs.has(techId)) return false;

        // Verificar si ya se está investigando
        if (this.researchQueue.some(item => item.techId === techId)) return false;

        if (!this.game.canAfford(tech.cost)) return false;
        return true;
    }

    startResearch(techId) {
        if (!this.canResearch(techId)) return;

        const tech = TECHNOLOGIES[techId];

        // Pagar costo
        for (let [res, amount] of Object.entries(tech.cost)) {
            this.game.resources[res] -= amount;
        }

        // Añadir a cola
        this.researchQueue.push({
            techId: techId,
            timer: tech.researchTime
        });

        this.game.updateUI();
        this.game.updateActionsPanel(); // Actualizar botones
        this.game.showNotification(`Investigando ${tech.name}...`, 'info');
    }

    update(deltaTime) {
        for (let i = this.researchQueue.length - 1; i >= 0; i--) {
            const item = this.researchQueue[i];
            item.timer -= deltaTime;

            if (item.timer <= 0) {
                this.completeResearch(item.techId);
                this.researchQueue.splice(i, 1);
            }
        }
    }

    completeResearch(techId) {
        const tech = TECHNOLOGIES[techId];
        this.researchedTechs.add(techId);
        tech.apply(this.game);
        this.game.showNotification(`¡${tech.name} investigado!`, 'success');
        this.game.updateActionsPanel(); // Quitar botón de la tecnología
    }

    isResearched(techId) {
        return this.researchedTechs.has(techId);
    }

    isResearching(techId) {
        return this.researchQueue.some(item => item.techId === techId);
    }

    getAvailableTechsForBuilding(buildingType) {
        return Object.values(TECHNOLOGIES).filter(tech =>
            tech.building === buildingType &&
            !this.researchedTechs.has(tech.id) &&
            !this.isResearching(tech.id)
        );
    }
}
