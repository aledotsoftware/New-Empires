/**
 * FormationManager - Sistema de formaciones para grupos de unidades
 * Permite organizar unidades en diferentes patrones de movimiento
 */

/**
 * Formaciones predefinidas
 */
export const FORMATIONS = {
    /**
     * Formación en línea horizontal
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    line: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;
        const startX = center.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions.push({
                x: startX + i * spacing,
                y: center.y
            });
        }
        return positions;
    },

    /**
     * Formación en columna vertical
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    column: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;
        const startY = center.y - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions.push({
                x: center.x,
                y: startY + i * spacing
            });
        }
        return positions;
    },

    /**
     * Formación en cuadrado/caja
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    box: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;
        const side = Math.ceil(Math.sqrt(count));

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / side);
            const col = i % side;
            positions.push({
                x: center.x + (col - (side - 1) / 2) * spacing,
                y: center.y + (row - (side - 1) / 2) * spacing
            });
        }
        return positions;
    },

    /**
     * Formación en cuña/flecha (para ataques)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    wedge: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;

        // La punta de la flecha al frente
        positions.push({ x: center.x, y: center.y });

        let row = 1;
        let placed = 1;
        while (placed < count) {
            const unitsInRow = Math.min(row + 1, count - placed);
            const startX = center.x - (unitsInRow - 1) * spacing / 2;

            for (let i = 0; i < unitsInRow; i++) {
                if (placed >= count) break;
                positions.push({
                    x: startX + i * spacing,
                    y: center.y + row * spacing
                });
                placed++;
            }
            row++;
        }
        return positions;
    },

    /**
     * Formación en V invertida (defensiva)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    vee: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;
        const halfCount = Math.ceil(count / 2);

        // Lado izquierdo
        for (let i = 0; i < halfCount; i++) {
            positions.push({
                x: center.x - i * spacing * 0.7,
                y: center.y + i * spacing
            });
        }

        // Lado derecho
        for (let i = 0; i < count - halfCount; i++) {
            positions.push({
                x: center.x + (i + 1) * spacing * 0.7,
                y: center.y + (i + 1) * spacing
            });
        }

        return positions;
    },

    /**
     * Formación en círculo (para defender un punto)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} radius - Radio del círculo (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    circle: (units, center, radius = 60) => {
        const positions = [];
        const count = units.length;
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2; // Empezar desde arriba
            positions.push({
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            });
        }
        return positions;
    },

    /**
     * Formación en escala/echelon (ataque/defensa en diagonal)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    echelon: (units, center, spacing = 40) => {
        const positions = [];
        const count = units.length;

        // Centrar la diagonal (que tiene tamaño de count * spacing)
        const offset = ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions.push({
                x: center.x - offset + i * spacing,
                y: center.y - offset + i * spacing
            });
        }
        return positions;
    },

    /**
     * Formación dispersa/irregular (para evitar ataques de área)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spread - Dispersión máxima (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    spread: (units, center, spread = 80) => {
        const positions = [];
        const count = units.length;

        for (let i = 0; i < count; i++) {
            // Usar una distribución más uniforme basada en índice
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const distance = (spread * 0.5) + (Math.random() * spread * 0.5);
            positions.push({
                x: center.x + Math.cos(angle) * distance,
                y: center.y + Math.sin(angle) * distance
            });
        }
        return positions;
    }
};

/**
 * Clase FormationManager para gestión de formaciones
 */
export class FormationManager {
    constructor() {
        this.currentFormation = 'box';
        this.spacing = 40;
    }

    /**
     * Obtiene las posiciones para una formación
     * @param {string} formationType - Tipo de formación
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación
     * @param {number} spacing - Espaciado opcional
     * @returns {Array} Posiciones calculadas
     */
    getPositions(formationType, units, center, spacing = this.spacing) {
        const formation = FORMATIONS[formationType] || FORMATIONS.box;
        return formation(units, center, spacing);
    }

    /**
     * Aplica una formación a un grupo de unidades
     * @param {string} formationType - Tipo de formación
     * @param {Array} units - Unidades a mover
     * @param {Object} center - Centro donde formar
     * @param {number} spacing - Espaciado
     */
    applyFormation(formationType, units, center, spacing = this.spacing) {
        const positions = this.getPositions(formationType, units, center, spacing);

        units.forEach((unit, index) => {
            if (positions[index]) {
                unit.targetX = positions[index].x;
                unit.targetY = positions[index].y;
            }
        });
    }

    /**
     * Cicla a la siguiente formación
     * @returns {string} Nueva formación
     */
    cycleFormation() {
        const formationNames = Object.keys(FORMATIONS);
        const currentIndex = formationNames.indexOf(this.currentFormation);
        this.currentFormation = formationNames[(currentIndex + 1) % formationNames.length];
        return this.currentFormation;
    }

    /**
     * Obtiene lista de formaciones disponibles
     * @returns {Array} Nombres de formaciones
     */
    getAvailableFormations() {
        return Object.keys(FORMATIONS);
    }
}

// Instancia global para compatibilidad
export const formationManager = new FormationManager();
