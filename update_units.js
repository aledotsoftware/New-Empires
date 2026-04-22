const fs = require('fs');

function updateWarrior() {
    let content = fs.readFileSync('js/entities/units/Warrior.js', 'utf8');
    content = content.replace(/score -= distSq \/ 200; \/\/ Menor penalización si ya lo estamos persiguiendo/, 'score -= distSq / 100; // Menor penalización si ya lo estamos persiguiendo');
    content = content.replace(/score -= distSq \/ 50; \/\/ Penalización normal para nuevos objetivos/, 'score -= distSq / 15; // Penalización normal para nuevos objetivos');
    content = content.replace(/this\.attackSpeed = 1\.2;/, 'this.attackSpeed = 1.2;\n        this.attackRange = 35;');
    fs.writeFileSync('js/entities/units/Warrior.js', content);
}

function updateSpearman() {
    let content = fs.readFileSync('js/entities/units/Spearman.js', 'utf8');
    content = content.replace(/this\.attackRange = 15;/, 'this.attackRange = 38;');
    content = content.replace(/score -= distSq \/ 50;/, 'score -= distSq / 15;');
    fs.writeFileSync('js/entities/units/Spearman.js', content);
}

function updateCavalry() {
    let content = fs.readFileSync('js/entities/units/Cavalry.js', 'utf8');
    content = content.replace(/this\.attackRange = 10;/, 'this.attackRange = 40;');
    content = content.replace(/score -= distSq \/ 80;/, 'score -= distSq / 25;');
    fs.writeFileSync('js/entities/units/Cavalry.js', content);
}

function updateArcher() {
    let content = fs.readFileSync('js/entities/units/Archer.js', 'utf8');
    content = content.replace(/score -= distSq \/ 1000;/, 'score -= distSq / 150;');
    content = content.replace(/const minKiteDistSq = this\.attackRangeSq \* 0\.81;/, 'const minKiteDistSq = this.attackRangeSq * 0.36;');
    fs.writeFileSync('js/entities/units/Archer.js', content);
}

updateWarrior();
updateSpearman();
updateCavalry();
updateArcher();
