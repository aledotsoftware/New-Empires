const fs = require('fs');

let content = fs.readFileSync('js/core/Game.js', 'utf8');

const oldAbs = `        // Si es un click simple (área muy pequeña), seleccionar la entidad más cercana
        if (Math.abs(this.dragStart.x - this.mouse.worldX) < 10 &&
            Math.abs(this.dragStart.y - this.mouse.worldY) < 10) {`;

const newAbs = `        // Si es un click simple (área muy pequeña), seleccionar la entidad más cercana
        const dxStart = this.dragStart.x - this.mouse.worldX;
        const dyStart = this.dragStart.y - this.mouse.worldY;
        if (dxStart * dxStart + dyStart * dyStart < 100) {`;

content = content.replace(oldAbs, newAbs);

fs.writeFileSync('js/core/Game.js', content, 'utf8');
console.log('Patched Game.js Math.abs');
