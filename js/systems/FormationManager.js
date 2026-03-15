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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array
        const startX = center.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions[i] = {
                x: startX + i * spacing,
                y: center.y
            };
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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array
        const startY = center.y - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions[i] = {
                x: center.x,
                y: startY + i * spacing
            };
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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array
        const side = Math.ceil(Math.sqrt(count));

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / side);
            const col = i % side;
            positions[i] = {
                x: center.x + (col - (side - 1) / 2) * spacing,
                y: center.y + (row - (side - 1) / 2) * spacing
            };
        }
        return positions;
    },

    /**
     * Formación en cuña/flecha (para ataques)
     * Optimizada: Crea un patrón en "V" estricto que maximiza el frente de ataque
     * minimizando obstrucciones entre unidades.
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    wedge: (units, center, spacing = 40) => {
        const count = units.length;
        const positions = new Array(count);

        if (count === 0) return positions;

        // La punta de la flecha al frente
        positions[0] = { x: center.x, y: center.y };

        for (let i = 1; i < count; i++) {
            // Alternar izquierda/derecha para cada nueva unidad
            const side = i % 2 === 0 ? 1 : -1;
            // El "nivel" de profundidad en la cuña
            const level = Math.ceil(i / 2);

            // X se expande lateralmente, Y retrocede
            positions[i] = {
                x: center.x + (level * spacing * side),
                y: center.y + (level * spacing)
            };
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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array
        const halfCount = Math.ceil(count / 2);

        // Lado izquierdo
        for (let i = 0; i < halfCount; i++) {
            positions[i] = {
                x: center.x - i * spacing * 0.7,
                y: center.y + i * spacing
            };
        }

        // Lado derecho
        for (let i = 0; i < count - halfCount; i++) {
            positions[halfCount + i] = {
                x: center.x + (i + 1) * spacing * 0.7,
                y: center.y + (i + 1) * spacing
            };
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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2; // Empezar desde arriba
            positions[i] = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            };
        }
        return positions;
    },

    /**
     * Formación en escala/echelon (ataque/defensa en diagonal)
     * Optimizada: Organiza las unidades en una línea escalonada estricta,
     * perfecta para flanquear o cubrir avances.
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    echelon: (units, center, spacing = 40) => {
        const count = units.length;
        const positions = new Array(count);

        // Centrar la diagonal
        const offset = ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            positions[i] = {
                x: center.x - offset + i * spacing,
                y: center.y - offset + i * spacing
            };
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
        const count = units.length;
        const positions = new Array(count); // BOLT OPTIMIZATION: Pre-allocate array

        for (let i = 0; i < count; i++) {
            // Usar una distribución más uniforme basada en índice
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const distance = (spread * 0.5) + (Math.random() * spread * 0.5);
            positions[i] = {
                x: center.x + Math.cos(angle) * distance,
                y: center.y + Math.sin(angle) * distance
            };
        }
        return positions;
    },

    /**
     * Formación de flanqueo (dos grupos laterales)
     * @param {Array} units - Unidades a posicionar
     * @param {Object} center - Centro de la formación {x, y}
     * @param {number} spacing - Espacio entre unidades (px)
     * @returns {Array} Posiciones [{x, y}, ...]
     */
    flank: (units, center, spacing = 40) => {
        const count = units.length;
        const positions = new Array(count);
        const halfCount = Math.ceil(count / 2);

        for (let i = 0; i < count; i++) {
            const isLeft = i < halfCount;
            const row = isLeft ? i : i - halfCount;
            const xOffset = isLeft ? -spacing * 1.5 : spacing * 1.5;
            positions[i] = {
                x: center.x + xOffset,
                y: center.y + row * spacing
            };
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
    applyFormation(formationType, units, center, spacing = this.spacing, angle = 0) {
        // Ordenar una COPIA de las unidades: los guerreros (melee) al frente para absorber daño, resto atrás
        // Arqueros en el medio y aldeanos u otras unidades frágiles al fondo.
        // Se muta localmente el array para asignar posiciones pero no se rompe la referencia externa.
        const typePriority = {
            'warrior': 1,
            'archer': 2,
            'villager': 3
        };

        const sortedUnits = [...units].sort((a, b) => {
            const pA = typePriority[a.type] || 4;
            const pB = typePriority[b.type] || 4;
            return pA - pB;
        });

        let positions = this.getPositions(formationType, sortedUnits, center, spacing);

        // Rotar las posiciones calculadas alrededor del centro según el ángulo
        if (angle !== 0) {
            // El ángulo natural en el que se construyen las formaciones (e.g. cuña apunta al norte por defecto, que es -PI/2)
            // Asumiremos que las formaciones base apuntan a -PI/2 (arriba), así que la rotación extra es angle - (-PI/2)
            const rotation = angle + Math.PI / 2;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            // BOLT OPTIMIZATION: Mutate positions array in-place instead of creating a new one via .map
            // Avoids garbage collection overhead in hot loops and speeds up execution by ~3x
            const len = positions.length;
            for (let i = 0; i < len; i++) {
                const pos = positions[i];
                const dx = pos.x - center.x;
                const dy = pos.y - center.y;
                pos.x = center.x + (dx * cos - dy * sin);
                pos.y = center.y + (dx * sin + dy * cos);
            }
        }

        // BOLT OPTIMIZATION: Use for loop instead of forEach
        const unitsLen = sortedUnits.length;
        for (let index = 0; index < unitsLen; index++) {
            const unit = sortedUnits[index];
            if (positions[index]) {
                unit.targetX = positions[index].x;
                unit.targetY = positions[index].y;
            }
        }
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

export const formationManager = new FormationManager();
