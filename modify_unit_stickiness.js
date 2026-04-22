const fs = require('fs');
let content = fs.readFileSync('js/entities/Unit.js', 'utf8');

content = content.replace(
    /            \/\/ Target Stickiness: Evitar cambiar de objetivo constantemente si ya estamos peleando\n            if \(this\.attackTarget === enemy\) \{\n                \/\/ Dynamically reduce stickiness if the enemy is successfully fleeing \(e\.g\. kiting archers\)\n                const isFleeing = distSq > 150 \* 150;\n                score \+= isFleeing \? 500 : 2000;\n            \}\n\n            const dx = this\.x - enemy\.x;\n            const dy = this\.y - enemy\.y;\n            const distSq = dx \* dx \+ dy \* dy;/,
    `            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distSq = dx * dx + dy * dy;

            // Target Stickiness: Evitar cambiar de objetivo constantemente si ya estamos peleando
            if (this.attackTarget === enemy) {
                // Dynamically reduce stickiness if the enemy is successfully fleeing (e.g. kiting archers)
                const isFleeing = distSq > 150 * 150;
                score += isFleeing ? 500 : 2000;
            }`
);

fs.writeFileSync('js/entities/Unit.js', content);
