const fs = require('fs');

let content = fs.readFileSync('js/core/Game.js', 'utf8');

const oldCamera = `
        // Normalizar vector de teclado si es diagonal
        if (dx !== 0 || dy !== 0) {
            // OPTIMIZATION: Math.sqrt is faster than Math.hypot
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * this.cameraConfig.baseSpeed;
            dy = (dy / length) * this.cameraConfig.baseSpeed;
        }`;

const newCamera = `
        // Normalizar vector de teclado si es diagonal
        if (dx !== 0 || dy !== 0) {
            // OPTIMIZATION: Fast path for orthogonal movement
            if (dx === 0) {
                dy = Math.sign(dy) * this.cameraConfig.baseSpeed;
            } else if (dy === 0) {
                dx = Math.sign(dx) * this.cameraConfig.baseSpeed;
            } else {
                // OPTIMIZATION: Math.sqrt is faster than Math.hypot
                const length = Math.sqrt(dx * dx + dy * dy);
                dx = (dx / length) * this.cameraConfig.baseSpeed;
                dy = (dy / length) * this.cameraConfig.baseSpeed;
            }
        }`;

content = content.replace(oldCamera, newCamera);
fs.writeFileSync('js/core/Game.js', content, 'utf8');
console.log('Patched updateCamera');
